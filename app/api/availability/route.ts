import { NextResponse } from 'next/server'
import { getTutorById } from '@/lib/tutors'
import { getCalendarEvents } from '@/lib/googleClient'
import { generateSlots, generateSlotsWithMetadata, parseAvailabilityEvent, parseAvailabilityEventWithTitle, parseBookingEvent, type AvailabilityWindow } from '@/lib/slotGenerator'
import { SessionLength } from '@/lib/types'

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    const sessionLengthParam = searchParams.get('sessionLength')

    if (!tutorId || !sessionLengthParam) {
      return NextResponse.json(
        { error: 'Missing tutorId or sessionLength' },
        { status: 400 }
      )
    }

    const sessionLength = parseInt(sessionLengthParam) as SessionLength
    if (![60, 15].includes(sessionLength)) {
      return NextResponse.json(
        { error: 'Invalid sessionLength. Must be 60 or 15' },
        { status: 400 }
      )
    }

    const tutor = getTutorById(tutorId)
    if (!tutor || !tutor.isActive) {
      return NextResponse.json(
        { error: 'Tutor not found or inactive' },
        { status: 404 }
      )
    }

    // Check if tutor has calendar connected
    if (!tutor.calendarConnected || !tutor.availabilityCalendarId) {
      // Tutor calendar not connected - return empty slots with a flag
      return NextResponse.json({ 
        slots: [],
        calendarNotConnected: true,
        message: 'Calendar is being finalized. Your request will be confirmed after payment.'
      })
    }

    // Get next 14 days
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch availability windows
    let availabilityEvents = []
    try {
      availabilityEvents = await getCalendarEvents(
        tutor.availabilityCalendarId,
        timeMin,
        timeMax
      )
    } catch (error: any) {
      console.error('Error fetching availability calendar:', error)
      
      // Handle OAuth token expiration gracefully
      if (error.message?.includes('GOOGLE_OAUTH_TOKEN_EXPIRED')) {
        return NextResponse.json(
          { 
            slots: [],
            calendarNotConnected: true,
            oauthTokenExpired: true,
            message: 'Calendar connection needs to be refreshed. Please contact support or check server logs for instructions to regenerate the OAuth token.'
          },
          { status: 200 } // Return 200 so UI doesn't break, but with empty slots
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch availability calendar: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Fetch existing bookings
    let bookingEvents: any[] = []
    try {
      if (tutor.bookingsCalendarId) {
        bookingEvents = await getCalendarEvents(
          tutor.bookingsCalendarId,
          timeMin,
          timeMax
        )
      }
    } catch (error: any) {
      console.error('Error fetching bookings calendar:', error)
      // Don't fail completely if bookings can't be fetched, just log and continue
      console.warn('Continuing without bookings data')
    }

    // Parse events with titles for pricing
    const availabilityData = availabilityEvents
      .map(parseAvailabilityEventWithTitle)
      .filter((d): d is NonNullable<typeof d> => d !== null)

    const availabilityWindows = availabilityData.map(d => d.window)
    
    // Pass availability data with titles directly (array format)
    const windowTitles: Array<{ window: AvailabilityWindow; title: string }> = 
      availabilityData.map(({ window, title }) => ({ window, title }))

    const bookings = bookingEvents
      .map(parseBookingEvent)
      .filter((b): b is NonNullable<typeof b> => b !== null)

    // Generate slots with metadata (including event titles)
    const slotsWithMetadata = generateSlotsWithMetadata(
      availabilityWindows,
      sessionLength,
      bookings,
      windowTitles
    )

    // Filter slots to only include times that are at least 2 hours in advance
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const filteredSlots = slotsWithMetadata.filter(slot => {
      const slotTime = new Date(slot.isoString)
      return slotTime >= twoHoursFromNow
    })

    // Return slots with their event titles for pricing
    const slots = filteredSlots.map(s => s.isoString)
    const slotTitles = Object.fromEntries(
      filteredSlots.map(s => [s.isoString, s.eventTitle || ''])
    )

    return NextResponse.json({ 
      slots,
      slotTitles // Map of slot ISO string to event title
    })
  } catch (error: any) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: `Failed to fetch availability: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

