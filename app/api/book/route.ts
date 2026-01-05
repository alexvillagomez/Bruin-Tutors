import { NextResponse } from 'next/server'
import { getTutorById } from '@/lib/tutors'
import { getCalendarEvents, createCalendarEvent } from '@/lib/googleClient'
import { parseAvailabilityEvent, parseBookingEvent } from '@/lib/slotGenerator'
import { hasOverlap } from '@/lib/overlap'
import { BookingRequest, SessionLength } from '@/lib/types'
import { randomUUID } from 'crypto'

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

export async function POST(request: Request) {
  try {
    const body: BookingRequest = await request.json()
    const {
      tutorId,
      sessionLength,
      startTimeISO,
      parentName,
      parentEmail,
      studentName,
      studentEmail,
      grade,
      course,
      helpText,
      materialsLink,
      fileNames
    } = body

    // Validate tutor
    const tutor = getTutorById(tutorId)
    if (!tutor || !tutor.isActive) {
      return NextResponse.json(
        { error: 'Tutor not found or inactive' },
        { status: 404 }
      )
    }

    // Validate session length
    if (![60, 90, 15].includes(sessionLength)) {
      return NextResponse.json(
        { error: 'Invalid sessionLength' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!parentName || !parentEmail || !studentName || !studentEmail || !grade || !course || !helpText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const startTime = new Date(startTimeISO)
    const endTime = new Date(startTime.getTime() + sessionLength * 60 * 1000)

    // Generate booking ID
    const bookingId = randomUUID()

    // Check if tutor has calendar connected
    if (!tutor.calendarConnected || !tutor.availabilityCalendarId || !tutor.bookingsCalendarId) {
      // TODO: Calendar not connected - manual confirmation required
      // For now, return booking ID without creating calendar events
      // In the future, this will:
      // - Send notification to admin
      // - Create calendar event manually
      // - Send confirmation email
      console.log(`Calendar not connected for tutor ${tutorId} - booking ${bookingId} requires manual confirmation`)
      
      return NextResponse.json({ 
        bookingId,
        calendarNotConnected: true,
        message: 'Your request will be confirmed after payment. Calendar is being finalized.'
      })
    }

    // Calendar is connected - proceed with normal booking flow
    // Recompute availability to confirm slot is still available
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

    let availabilityEvents = []
    try {
      availabilityEvents = await getCalendarEvents(
        tutor.availabilityCalendarId,
        timeMin,
        timeMax
      )
    } catch (error: any) {
      console.error('Error fetching availability calendar for booking:', error)
      return NextResponse.json(
        { error: `Failed to access availability calendar: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    let bookingEvents = []
    try {
      if (tutor.bookingsCalendarId) {
        bookingEvents = await getCalendarEvents(
          tutor.bookingsCalendarId,
          timeMin,
          timeMax
        )
      }
    } catch (error: any) {
      console.error('Error fetching bookings calendar for booking:', error)
      // Continue without bookings if we can't fetch them
      console.warn('Continuing booking creation without existing bookings data')
    }

    const availabilityWindows = availabilityEvents
      .map(parseAvailabilityEvent)
      .filter((w): w is NonNullable<typeof w> => w !== null)

    const bookings = bookingEvents
      .map(parseBookingEvent)
      .filter((b): b is NonNullable<typeof b> => b !== null)

    // Check if slot fits in any availability window
    const fitsInWindow = availabilityWindows.some(window => {
      return startTime >= window.start && endTime <= window.end
    })

    if (!fitsInWindow) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 409 }
      )
    }

    // Check for overlaps with existing bookings
    if (hasOverlap(startTime, endTime, bookings)) {
      return NextResponse.json(
        { error: 'Selected time slot is already booked' },
        { status: 409 }
      )
    }

    // Create event title
    const eventTitle = sessionLength === 15
      ? `Bruin Tutors Consultation — ${studentName}`
      : `Bruin Tutors Session — ${studentName} (${sessionLength}m)`

    // Create event description
    let description = `Booking ID: ${bookingId}\n\n`
    description += `Student: ${studentName}\n`
    description += `Student Email: ${studentEmail}\n`
    description += `Parent: ${parentName}\n`
    description += `Parent Email: ${parentEmail}\n`
    description += `Grade: ${grade}\n`
    description += `Course: ${course}\n\n`
    description += `What they need help with:\n${helpText}\n\n`
    
    if (materialsLink) {
      description += `Materials Link: ${materialsLink}\n\n`
    }
    
    if (fileNames) {
      description += `Uploaded Files: ${fileNames}\n\n`
    }
    
    if (tutor.zoomLink) {
      description += `Zoom Meeting Link:\n${tutor.zoomLink}\n`
    } else {
      description += `Zoom link will be emailed.\n`
    }

    // Prepare attendees - include both parent and student emails
    const attendees: Array<{ email: string; displayName?: string }> = []
    if (parentEmail) {
      attendees.push({
        email: parentEmail,
        displayName: parentName,
      })
    }
    if (studentEmail && studentEmail !== parentEmail) {
      attendees.push({
        email: studentEmail,
        displayName: studentName,
      })
    }

    const eventData = {
      summary: eventTitle,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: TIMEZONE
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: TIMEZONE
      },
      attendees: attendees.length > 0 ? attendees : undefined,
      extendedProperties: {
        private: {
          bookingId
        }
      }
    }

    // Create booking in bookings calendar with invites
    await createCalendarEvent(
      tutor.bookingsCalendarId, 
      eventData,
      { sendUpdates: 'all' } // Send invites to all attendees
    )

    // Create mirrored booking in availability calendar (no invites needed)
    const availabilityEventData = { ...eventData }
    delete availabilityEventData.attendees // Don't send invites for availability calendar
    await createCalendarEvent(tutor.availabilityCalendarId, availabilityEventData)

    return NextResponse.json({ bookingId })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

