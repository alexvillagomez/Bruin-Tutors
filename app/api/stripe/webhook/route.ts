import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { getTutorById } from '@/lib/tutors'
import { createCalendarEvent } from '@/lib/googleClient'
import Stripe from 'stripe'

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

// Allow GET requests for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  console.log('📥 Webhook endpoint hit at', timestamp)
  console.log('📥 Request URL:', request.url)
  console.log('📥 Request method:', request.method)
  
  const body = await request.text()
  console.log('📥 Body length:', body.length, 'bytes')
  
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')
  console.log('📥 Stripe signature present:', !!signature)

  console.log('📋 Webhook headers:', {
    hasSignature: !!signature,
    contentType: headersList.get('content-type'),
  })

  if (!signature) {
    console.error('❌ No signature provided in webhook request')
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log('✅ Webhook signature verified successfully')
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', {
      error: err.message,
      hasBody: !!body,
      bodyLength: body?.length,
      hasSignature: !!signature,
      webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
    })
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  console.log('🔔 Webhook event received:', event.type, 'at', new Date().toISOString())

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('📋 Processing checkout.session.completed:', {
        sessionId: session.id,
        metadata: session.metadata,
        customerEmail: session.customer_email,
      })

      // Parse required metadata
      const tutorId = session.metadata?.tutorId || session.metadata?.tutorSlug
      const startDateTimeISO = session.metadata?.startDateTimeISO
      const durationMinutes = parseInt(session.metadata?.durationMinutes || '60', 10)
      const parentEmail = session.metadata?.parentEmail || session.customer_email
      const parentName = session.metadata?.parentName || session.customer_details?.name || 'Parent'
      const studentEmail = session.metadata?.studentEmail || session.metadata?.userEmail
      const studentName = session.metadata?.studentName || 'Student'

      console.log('📋 Parsed metadata:', {
        tutorId,
        startDateTimeISO,
        durationMinutes,
        parentEmail,
        parentName,
        studentEmail,
        studentName,
      })

      // Validate required fields
      if (!tutorId || !startDateTimeISO) {
        console.error('❌ Missing required metadata in checkout session', {
          sessionId: session.id,
          tutorId,
          startDateTimeISO,
          metadata: session.metadata,
        })
        return NextResponse.json(
          { error: 'Missing required metadata' },
          { status: 400 }
        )
      }

      // Validate tutor exists
      const tutor = getTutorById(tutorId)
      if (!tutor) {
        console.error(`Tutor not found: ${tutorId}`, { sessionId: session.id })
        return NextResponse.json(
          { error: 'Tutor not found' },
          { status: 400 }
        )
      }

      // Parse times (stored in UTC)
      const startTime = new Date(startDateTimeISO)
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

      console.log('Payment successful:', {
        sessionId: session.id,
        tutorId,
        parentEmail,
        studentEmail,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        amount: session.amount_total,
        currency: session.currency,
      })

      // Create Google Calendar event if calendar is connected
      let googleCalendarEventId: string | null = null
      let calendarEventLink: string | null = null
      const calendarConnected = session.metadata?.calendarConnected === 'true'
      
      console.log('🔍 Calendar event creation check:', {
        calendarConnectedFromMetadata: session.metadata?.calendarConnected,
        calendarConnectedParsed: calendarConnected,
        tutorCalendarConnected: tutor.calendarConnected,
        hasBookingsCalendarId: !!tutor.bookingsCalendarId,
        bookingsCalendarId: tutor.bookingsCalendarId,
        tutorId: tutor.id,
        willCreateEvent: calendarConnected && !!tutor.bookingsCalendarId,
      })
      
      if (calendarConnected && tutor.bookingsCalendarId) {
        try {
          const eventTitle = `Bruin Tutors Session — ${studentName}`
          
          // Build event description with all information
          let eventDescription = `Stripe Session ID: ${session.id}\n\n`
          eventDescription += `Tutor: ${tutor.displayName}\n`
          eventDescription += `Student: ${studentName}\n`
          eventDescription += `Student Email: ${studentEmail || 'N/A'}\n`
          eventDescription += `Parent: ${parentName}\n`
          eventDescription += `Parent Email: ${parentEmail || 'N/A'}\n`
          
          // Add tutor contact information
          if (tutor.phone || tutor.email) {
            eventDescription += `\nTutor Contact Information:\n`
            if (tutor.phone) {
              eventDescription += `Phone: ${tutor.phone}\n`
            }
            if (tutor.email) {
              eventDescription += `Email: ${tutor.email}\n`
            }
          }
          
          if (tutor.zoomLink) {
            eventDescription += `\nZoom Meeting Link:\n${tutor.zoomLink}`
          } else {
            eventDescription += `\n\nZoom link will be sent separately.`
          }

          console.log('Creating calendar event with invite:', {
            calendarId: tutor.bookingsCalendarId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            parentEmail,
            studentEmail,
          })

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

          const calendarEvent = await createCalendarEvent(
            tutor.bookingsCalendarId,
            {
              summary: eventTitle,
              description: eventDescription,
              start: {
                dateTime: startTime.toISOString(),
                timeZone: TIMEZONE,
              },
              end: {
                dateTime: endTime.toISOString(),
                timeZone: TIMEZONE,
              },
              attendees: attendees.length > 0 ? attendees : undefined,
              extendedProperties: {
                private: {
                  stripeSessionId: session.id,
                  tutorId: tutor.id,
                },
              },
            },
            {
              sendUpdates: 'all', // Send invites to all attendees
            }
          )

          googleCalendarEventId = calendarEvent.id || null
          calendarEventLink = calendarEvent.htmlLink || null
          
          console.log('✅ Calendar event created with invite:', {
            eventId: googleCalendarEventId,
            htmlLink: calendarEventLink,
            attendees: calendarEvent.attendees?.map((a: any) => a.email),
          })
        } catch (calendarError: any) {
          console.error('❌ Failed to create calendar event:', {
            error: calendarError.message,
            stack: calendarError.stack,
            calendarId: tutor.bookingsCalendarId,
            sessionId: session.id,
          })
          
          // Log specific OAuth token errors prominently
          if (calendarError.message?.includes('GOOGLE_OAUTH_TOKEN_EXPIRED')) {
            console.error('🚨 CRITICAL: Google OAuth token expired. Calendar events cannot be created until token is regenerated.')
            console.error('🚨 Run: npx tsx scripts/google-refresh-token.ts')
          }
          
          // Don't fail the webhook if calendar event creation fails
          // Payment was successful, but calendar event creation failed
        }
      } else {
        console.log('⚠️ Calendar event not created - conditions not met:', {
          calendarConnected,
          calendarConnectedFromMetadata: session.metadata?.calendarConnected,
          hasBookingsCalendarId: !!tutor.bookingsCalendarId,
          tutorId: tutor.id,
          tutorCalendarConnected: tutor.calendarConnected,
        })
      }

      // Calendar event creation already sends invites via sendUpdates: 'all'
      // Google Calendar will automatically send email invites to all attendees
      if (calendarEventLink) {
        const inviteEmails = [parentEmail, studentEmail].filter(Boolean)
        console.log('✅ Calendar invites will be sent to:', inviteEmails)
      } else {
        console.warn('No calendar event created - invites cannot be sent')
      }

      const response = {
        received: true,
        message: 'Payment processed successfully',
        calendarEventId: googleCalendarEventId,
        calendarEventLink,
        inviteSent: !!(parentEmail || studentEmail) && !!googleCalendarEventId,
        calendarEventCreated: !!googleCalendarEventId,
        warning: !googleCalendarEventId && calendarConnected ? 'Calendar event creation failed. Check server logs for details.' : undefined,
      }
      
      console.log('✅ Webhook processing complete, returning response:', response)
      
      return NextResponse.json(response, { status: 200 })
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('PaymentIntent succeeded:', paymentIntent.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.error('PaymentIntent failed:', paymentIntent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

