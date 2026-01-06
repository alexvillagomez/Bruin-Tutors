import { NextResponse } from 'next/server'
import { getTutorById } from '@/lib/tutors'
import { createCalendarEvent } from '@/lib/googleClient'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to verify calendar event creation works
 * Usage: POST /api/test-webhook-calendar
 * Body: { tutorId: string, startTimeISO: string, parentEmail: string, studentEmail: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tutorId, startTimeISO, parentEmail, studentEmail } = body

    if (!tutorId || !startTimeISO) {
      return NextResponse.json(
        { error: 'Missing tutorId or startTimeISO' },
        { status: 400 }
      )
    }

    const tutor = getTutorById(tutorId)
    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    if (!tutor.bookingsCalendarId) {
      return NextResponse.json(
        { error: 'Tutor does not have a bookings calendar configured' },
        { status: 400 }
      )
    }

    const startTime = new Date(startTimeISO)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 60 minutes

    console.log('🧪 Testing calendar event creation:', {
      tutorId,
      calendarId: tutor.bookingsCalendarId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    })

    const event = await createCalendarEvent(
      tutor.bookingsCalendarId,
      {
        summary: `Test Event — ${new Date().toISOString()}`,
        description: 'This is a test event to verify calendar integration works.',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        attendees: parentEmail || studentEmail
          ? [
              ...(parentEmail ? [{ email: parentEmail, displayName: 'Test Parent' }] : []),
              ...(studentEmail && studentEmail !== parentEmail
                ? [{ email: studentEmail, displayName: 'Test Student' }]
                : []),
            ]
          : undefined,
      },
      {
        sendUpdates: 'all',
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      eventId: event.id,
      htmlLink: event.htmlLink,
      attendees: event.attendees?.map((a: any) => a.email),
    })
  } catch (error: any) {
    console.error('❌ Test calendar event creation failed:', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

