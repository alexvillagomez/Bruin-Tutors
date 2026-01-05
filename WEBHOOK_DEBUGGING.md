# Webhook Debugging Guide

## Problem: Calendar events not being created after payment

If you see the payment success page but no calendar event is created, the Stripe webhook is likely not being triggered.

## Why This Happens

When testing locally, Stripe **cannot reach** `localhost:3000/api/stripe/webhook` directly. You need to use **Stripe CLI** to forward webhooks to your local server.

## Solution: Use Stripe CLI for Local Testing

### Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate.

### Step 3: Forward Webhooks to Local Server

In a **separate terminal window**, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will:
- Show you a webhook signing secret (starts with `whsec_...`)
- Forward all Stripe events to your local server
- Display webhook events in real-time

### Step 4: Update Your Webhook Secret (if needed)

If Stripe CLI gives you a different webhook secret, update `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...  # Use the secret from `stripe listen`
```

**Important:** Restart your Next.js dev server after updating the webhook secret!

### Step 5: Test a Payment

1. Make sure `stripe listen` is running in one terminal
2. Make sure your Next.js server is running (`npm run dev`)
3. Complete a test booking
4. Watch both terminals for:
   - Stripe CLI: Should show `checkout.session.completed` event
   - Next.js server: Should show `🔔 Webhook event received: checkout.session.completed`

## Check Server Logs

After completing a payment, check your Next.js server logs for:

✅ **Success indicators:**
- `🔔 Webhook event received: checkout.session.completed`
- `Payment successful: {...}`
- `Creating calendar event with invite: {...}`
- `✅ Calendar event created with invite: {...}`

❌ **Error indicators:**
- `Missing required metadata in checkout session`
- `Tutor not found: ...`
- `❌ Failed to create calendar event: ...`
- `Calendar event not created: {...}`

## Common Issues

### Issue 1: "Webhook signature verification failed"
- **Cause:** Wrong webhook secret or webhook not from Stripe CLI
- **Fix:** Use the webhook secret from `stripe listen` output

### Issue 2: "Missing required metadata"
- **Cause:** Checkout session doesn't have required metadata
- **Fix:** Check that `app/api/stripe/checkout/route.ts` is setting all metadata fields

### Issue 3: "Calendar event not created"
- **Cause:** `calendarConnected` is not 'true' or `bookingsCalendarId` is missing
- **Fix:** Check server logs for the reason, verify tutor data in `data/tutors.json`

### Issue 4: "❌ Failed to create calendar event"
- **Cause:** Google Calendar API error (permissions, expired token, etc.)
- **Fix:** Check the error message in logs, verify Google OAuth credentials

## Production Setup

For production, you need to:

1. **Configure webhook in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events to send: `checkout.session.completed`
   - Copy the "Signing secret" and add to production environment variables

2. **Verify webhook is working:**
   - Stripe Dashboard → Webhooks → Your endpoint
   - Check "Recent events" to see if webhooks are being delivered
   - Green checkmark = success, red X = failure

## Quick Test

To manually trigger a test webhook event:

```bash
stripe trigger checkout.session.completed
```

This will create a test event and forward it to your local server.

## Still Not Working?

1. **Check if webhook is being called:**
   - Look for `🔔 Webhook event received` in server logs
   - If you don't see this, the webhook isn't reaching your server

2. **Check metadata:**
   - Look for `Payment successful:` log entry
   - Verify `tutorId`, `startDateTimeISO`, and `userEmail` are present

3. **Check calendar creation:**
   - Look for `Creating calendar event with invite:` log entry
   - Check for any error messages after this

4. **Verify Google Calendar credentials:**
   - Ensure all Google OAuth env vars are set
   - Test calendar access: Visit `/api/test-calendar?tutorId=alex` (if endpoint exists)

