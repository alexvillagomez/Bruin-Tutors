import { NextResponse } from 'next/server'
import { getTutorById } from '@/lib/tutors'
import { getCalendarEvents } from '@/lib/googleClient'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId') || 'alex'

    const tutor = getTutorById(tutorId)
    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const results: any = {
      tutor: {
        id: tutor.id,
        displayName: tutor.displayName,
        availabilityCalendarId: tutor.availabilityCalendarId,
        bookingsCalendarId: tutor.bookingsCalendarId
      },
      tests: {}
    }

    // Test availability calendar
    if (tutor.availabilityCalendarId) {
      try {
        const availabilityEvents = await getCalendarEvents(
          tutor.availabilityCalendarId,
          timeMin,
          timeMax
        )
        results.tests.availability = {
          success: true,
          eventCount: availabilityEvents.length,
          events: availabilityEvents.map(e => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date
          }))
        }
      } catch (error: any) {
        results.tests.availability = {
          success: false,
          error: error.message,
          code: error.code
        }
      }
    } else {
      results.tests.availability = {
        success: false,
        error: 'Availability calendar ID not configured'
      }
    }

    // Test bookings calendar
    if (tutor.bookingsCalendarId) {
      try {
        const bookingEvents = await getCalendarEvents(
          tutor.bookingsCalendarId,
          timeMin,
          timeMax
        )
        results.tests.bookings = {
          success: true,
          eventCount: bookingEvents.length,
          events: bookingEvents.map(e => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date
          }))
        }
      } catch (error: any) {
        results.tests.bookings = {
          success: false,
          error: error.message,
          code: error.code
        }
      }
    } else {
      results.tests.bookings = {
        success: false,
        error: 'Bookings calendar ID not configured'
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error in test-calendar:', error)
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

