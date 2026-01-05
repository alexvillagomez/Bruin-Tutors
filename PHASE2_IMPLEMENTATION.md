# Phase 2 Implementation Summary - Bookings as Source of Truth

## Overview

Phase 2 implements a complete booking system where bookings are created via Stripe webhooks (source of truth) and displayed on the user dashboard. All bookings are stored in the database and linked to users, tutors, and Stripe payments.

## Database Schema Changes

### New Booking Model (`prisma/schema.prisma`)

Added `Booking` model with:
- `id` (cuid)
- `userId` (FK to User, nullable for unclaimed bookings)
- `tutorId` (string matching tutor id from tutors data)
- `startTime` / `endTime` (DateTime, stored in UTC)
- `status` (enum: SCHEDULED | COMPLETED | CANCELED)
- `priceCents` (int)
- `currency` (string, default "usd")
- `stripeCheckoutSessionId` (string, unique - for idempotency)
- `stripePaymentIntentId` (string, optional)
- `stripeCustomerId` (string, optional)
- `googleCalendarEventId` (string, optional)
- `createdAt` / `updatedAt` (timestamps)

**Indexes:**
- `[userId, startTime]` - for user dashboard queries
- `[tutorId, startTime]` - for tutor-specific queries
- `[stripeCheckoutSessionId]` - for idempotency checks

**Migration:** `20251226044008_add_booking_model`

## Files Changed/Added

### 1. Database Schema
- **`prisma/schema.prisma`**
  - Added `Booking` model with all required fields
  - Added `BookingStatus` enum
  - Added `bookings` relation to `User` model
  - Added indexes for efficient queries

### 2. Stripe Webhook Handler
- **`app/api/stripe/webhook/route.ts`**
  - **Major rewrite** to create bookings from `checkout.session.completed` events
  - **Idempotency**: Checks for existing booking by `stripeCheckoutSessionId` before creating
  - **User linking**: Finds or creates user by email if `userId` not in metadata
  - **Metadata parsing**: Extracts `tutorId`, `startDateTimeISO`, `userId`, `userEmail`, `durationMinutes`
  - **Calendar integration**: Optionally creates Google Calendar event if calendar is connected
  - **Error handling**: Robust error handling with detailed logging (no secrets logged)
  - **Returns proper HTTP codes** to Stripe

### 3. Stripe Checkout Creation
- **`app/api/stripe/checkout/route.ts`**
  - **Authentication required**: Returns 401 if user not logged in
  - **Metadata updates**: 
    - Added `userId` to metadata (from session)
    - Added `tutorId` (replaces `tutorSlug` for consistency)
    - Added `userEmail` as fallback
    - All existing metadata preserved (pricing breakdown, times, etc.)
  - **User session**: Gets current user from NextAuth session

### 4. Dashboard Page
- **`app/dashboard/page.tsx`**
  - **Real data**: Fetches bookings from database for logged-in user
  - **Splits bookings**: 
    - Upcoming: `startTime >= now` AND `status === 'SCHEDULED'`
    - Past: `startTime < now` OR `status === 'COMPLETED'`
  - **Booking cards**: Display tutor name, date/time, duration, price, status
  - **"Book again" button**: Links to `/book-now?tutor={tutorId}` with tutor preselected
  - **Fallback handling**: Shows safe fallback if tutor not found

- **`app/dashboard/page.module.css`**
  - Added styles for booking cards, booking details, "Book again" button
  - Responsive design maintained

### 5. Booking Flow
- **`app/book-now/page.tsx`**
  - **Removed `/api/book` call**: Bookings now created only via webhook
  - **Authentication check**: Redirects to login if not authenticated when proceeding to payment (step 4 → 5)
  - **Direct checkout**: Goes straight to Stripe checkout creation (no pre-booking)
  - **Tutor preselection**: Handles `?tutor={id}` query param for "Book again" flow

### 6. Success Page
- **`app/payment/success/page.tsx`**
  - **Updated messaging**: Clarifies that booking is being processed (not created client-side)
  - **Dashboard link**: Added "View My Sessions" button linking to `/dashboard`
  - **No booking creation**: Removed any client-side booking creation logic

## Key Features Implemented

### ✅ Booking Creation (Webhook-Driven)
- Bookings created **only** via Stripe webhook on `checkout.session.completed`
- Idempotent: Duplicate webhook calls don't create duplicate bookings
- Links to user via `userId` from session
- Stores all Stripe identifiers (session ID, payment intent, customer ID)
- Optionally creates Google Calendar event and stores event ID

### ✅ User Authentication Integration
- Checkout **requires** authentication (401 if not logged in)
- User redirected to login if not authenticated when proceeding to payment
- `userId` automatically included in checkout metadata
- User email used as fallback if user not found

### ✅ Dashboard with Real Data
- Fetches and displays actual bookings from database
- Splits into Upcoming and Past sessions
- Shows tutor name, date/time, duration, price, status
- "Book again" functionality with tutor preselection

### ✅ Data Integrity
- All times stored in UTC in database
- Proper timezone handling in display
- Tutor lookup with fallback for missing tutors
- Status tracking (SCHEDULED, COMPLETED, CANCELED)

## Testing Checklist

To verify Phase 2 is working:

1. **Logged-in user completes Stripe checkout**
   - ✅ Booking row appears in database via webhook
   - ✅ Booking linked to user via `userId`
   - ✅ Booking has correct `tutorId`, times, price

2. **User visits /dashboard**
   - ✅ Sees booking under "Upcoming Sessions"
   - ✅ Booking shows correct tutor name, date/time, price

3. **Time-based filtering**
   - ✅ When time passes (or with manually adjusted timestamps), booking appears under "Past Sessions"

4. **"Book again" functionality**
   - ✅ Clicking "Book again" navigates to `/book-now?tutor={tutorId}`
   - ✅ Tutor is preselected in booking flow

5. **Idempotency**
   - ✅ Refreshing success page does not create duplicate bookings
   - ✅ Retried Stripe webhooks do not create duplicate bookings

6. **Authentication**
   - ✅ Unauthenticated users redirected to login when trying to proceed to payment
   - ✅ Checkout API returns 401 if not authenticated

## Environment Variables

No new environment variables required. Existing Stripe variables are used:
- `STRIPE_SECRET_KEY` (already set)
- `STRIPE_WEBHOOK_SECRET` (already set)

## Local Webhook Testing

To test webhooks locally with Stripe CLI:

```bash
# Install Stripe CLI (if not already installed)
# macOS: brew install stripe/stripe-cli/stripe
# Or download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

The webhook secret will be printed when you run `stripe listen`. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Database Migration

Migration has been applied:
- Migration name: `20251226044008_add_booking_model`
- Tables created: `Booking`
- Indexes created: 3 indexes for efficient queries

## Next Steps (Future Phases)

- Phase 3: Reschedule and refund functionality
- Admin portal for managing bookings
- Tutor portal for viewing their bookings
- Email notifications for booking confirmations
- Calendar sync improvements

## Notes

- Bookings are the **source of truth** - created only via webhook
- No client-side booking creation
- All times stored in UTC, displayed in user's local timezone
- Tutor lookup uses the single source of truth (`lib/tutors.ts`)
- Calendar events created in webhook (optional, only if calendar connected)
- Free consultations (15-minute) still handled separately (not in Phase 2 scope)

