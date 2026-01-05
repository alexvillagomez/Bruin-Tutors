import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { calculateHourlyPriceCents } from '@/lib/pricing'
import { getTutorById } from '@/lib/tutors'
import { getCalendarEvents } from '@/lib/googleClient'
import { parseAvailabilityEventWithTitle } from '@/lib/slotGenerator'
import Stripe from 'stripe'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      amount, // Client-computed amount (for reference, but we'll recompute server-side)
      currency = 'usd', 
      description, 
      tutorSlug, 
      parentEmail,
      parentName,
      studentEmail, 
      studentName,
      sessionLength,
      startDateTimeISO, // Booking start time
      calendarEventTitle, // Event title from client (optional, we'll fetch if needed)
    } = body

    // Validate required fields
    if (!startDateTimeISO) {
      return NextResponse.json(
        { error: 'startDateTimeISO is required' },
        { status: 400 }
      )
    }

    // Enforce 60-minute sessions only (ignore client-provided duration)
    const durationMinutes = 60

    // Get tutor first (needed for base rate and calendar title)
    const tutor = tutorSlug ? getTutorById(tutorSlug) : null
    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Get tutor to fetch calendar event title if not provided
    let eventTitle = calendarEventTitle
    if (!eventTitle) {
      // First try tutor's calendarTitleForPricing field (placeholder)
      if (tutor.calendarTitleForPricing) {
        eventTitle = tutor.calendarTitleForPricing
      } else if (tutor.availabilityCalendarId) {
        try {
          // Fetch calendar events around the booking time to get the event title
          const startTime = new Date(startDateTimeISO)
          const timeMin = new Date(startTime.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day before
          const timeMax = new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString() // 1 day after
          
          const events = await getCalendarEvents(
            tutor.availabilityCalendarId,
            timeMin,
            timeMax
          )
          
          // Find the event that contains this time slot
          for (const event of events) {
            const eventData = parseAvailabilityEventWithTitle(event)
            if (eventData) {
              const eventStart = eventData.window.start
              const eventEnd = eventData.window.end
              if (startTime >= eventStart && startTime < eventEnd) {
                eventTitle = eventData.title
                break
              }
            }
          }
        } catch (error) {
          console.warn('Could not fetch calendar event title for pricing:', error)
          // Continue with undefined eventTitle (will default to WTP 5)
        }
      }
    }

    // Compute price server-side using simple pricing algorithm (do not trust client input)
    const pricingResult = calculateHourlyPriceCents({
      startISO: startDateTimeISO,
      calendarTitle: eventTitle,
      baseRateCents: tutor.baseRateCents,
    })

    // For 60-minute session, hourly price = total price
    const amountInCents = pricingResult.hourlyCents

    // Create checkout session with dynamic pricing
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || `Tutoring Session (60 minutes)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/payment/cancel`,
      metadata: {},
    }

    // Add required metadata for booking creation
    if (tutorSlug) {
      sessionParams.metadata.tutorId = tutorSlug // Use tutorId (same as tutorSlug in our system)
      sessionParams.metadata.tutorSlug = tutorSlug // Keep for backward compatibility
    }
    
    // Add parent and student information to metadata
    if (parentEmail) {
      sessionParams.metadata.parentEmail = parentEmail
      sessionParams.customer_email = parentEmail // Use parent email as primary contact
    }
    if (parentName) {
      sessionParams.metadata.parentName = parentName
    }
    if (studentEmail) {
      sessionParams.metadata.studentEmail = studentEmail
      sessionParams.metadata.userEmail = studentEmail // Keep for backward compatibility
    }
    if (studentName) {
      sessionParams.metadata.studentName = studentName
    }
    
    sessionParams.metadata.sessionLength = '60' // Always 60 minutes
    
    // Include calendar connection status in metadata
    const calendarConnected = tutor.calendarConnected !== false ? 'true' : 'false'
    sessionParams.metadata.calendarConnected = calendarConnected
    
    // Store pricing breakdown in metadata
    const { breakdown } = pricingResult
    sessionParams.metadata.baseCents = String(breakdown.baseCents)
    sessionParams.metadata.hourlyCents = String(breakdown.hourlyCents)
    sessionParams.metadata.daysInAdvance = String(breakdown.daysInAdvance)
    sessionParams.metadata.leadAddOnCents = String(breakdown.leadAddOnCents)
    sessionParams.metadata.wtp = String(breakdown.wtp)
    sessionParams.metadata.wtpAddOnCents = String(breakdown.wtpAddOnCents)
    sessionParams.metadata.startDateTimeISO = startDateTimeISO
    sessionParams.metadata.durationMinutes = '60'

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

