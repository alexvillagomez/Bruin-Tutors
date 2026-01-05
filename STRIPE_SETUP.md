# Stripe Payment Integration Setup

## 📋 Overview

This project uses Stripe Checkout Sessions for one-time payments. Users are redirected to Stripe's hosted checkout page, then redirected back to your site on success or cancel.

## 🔧 Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Secret Key (from Stripe Dashboard > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (from Stripe Dashboard > Developers > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# For production: NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Optional: Stripe Price IDs (can also be hardcoded in checkout route)
NEXT_PUBLIC_STRIPE_PRICE_60=price_xxxxx  # 60-minute session
NEXT_PUBLIC_STRIPE_PRICE_90=price_xxxxx  # 90-minute session
```

## 💳 Setting Up Stripe Price IDs

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add Product**
3. Create products for your session types:
   - **60-minute session** - $50
   - **90-minute session** - $75
4. For each product, create a **Price**:
   - Set amount: $50 or $75
   - Set currency: USD
   - Set billing period: One time
5. Copy the **Price ID** (starts with `price_`)
6. Update `app/api/stripe/checkout/route.ts`:
   ```typescript
   const priceIdMap: Record<number, string> = {
     60: 'price_YOUR_60_MIN_PRICE_ID',
     90: 'price_YOUR_90_MIN_PRICE_ID',
   }
   ```
   Or set them in environment variables as shown above.

## 🔗 Webhook Setup

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Production

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add to your production environment variables

## 📁 File Structure

```
lib/stripe.ts                          # Stripe client initialization
app/api/stripe/checkout/route.ts      # Creates checkout sessions
app/api/stripe/webhook/route.ts       # Handles webhook events
app/book-now/page.tsx                 # Booking flow with payment integration
app/payment/success/page.tsx         # Success page after payment
app/payment/cancel/page.tsx          # Cancel page if payment cancelled
app/pay/page.tsx                      # Test payment page
```

## 🔄 Payment Flow

1. User completes booking form → clicks "Continue to Payment"
2. Booking is created in Google Calendar (via `/api/book`)
3. Checkout session is created (via `/api/stripe/checkout`)
4. User is redirected to Stripe Checkout
5. User completes payment on Stripe
6. Stripe redirects to `/payment/success?session_id=...`
7. Webhook receives `checkout.session.completed` event
8. Webhook processes payment (TODO: save to DB, send email, etc.)

## ✅ Testing

### Test Mode

1. Use test API keys from Stripe Dashboard
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any CVC, any ZIP

### Test Payment Page

Visit: `http://localhost:3000/pay?tutor=lauren-chen`

This page allows you to test the Stripe checkout flow without going through the full booking process.

## 🛠️ TODO: Complete Webhook Implementation

In `app/api/stripe/webhook/route.ts`, you need to implement:

1. **Save order to database:**
   ```typescript
   await saveOrderToDatabase({
     sessionId: session.id,
     email: session.customer_email,
     amount: session.amount_total,
     tutorSlug: session.metadata?.tutorSlug,
     status: 'paid',
     createdAt: new Date()
   })
   ```

2. **Send confirmation email:**
   ```typescript
   await sendConfirmationEmail(session.customer_email, {
     sessionId: session.id,
     amount: session.amount_total,
     bookingDetails: {...}
   })
   ```

3. **Confirm calendar booking:**
   - If booking was created before payment, mark it as confirmed
   - Or create the booking now if it was pending payment

## 🔒 Security Notes

- ✅ Secret keys are server-side only (never exposed to client)
- ✅ Webhook signatures are verified
- ✅ Raw request body is used for signature verification (not JSON parsed)
- ✅ All sensitive operations happen server-side

## 📝 Notes

- Free consultations (15-minute) skip payment and go directly to booking
- Price IDs can be hardcoded in the checkout route or set via environment variables
- Tutor slug is passed in metadata for tracking which tutor was booked
- Customer email is pre-filled if provided in the booking form

