# Stripe Webhook Setup Guide

## Problem: Calendar events not being created after payment

If payments are successful but calendar events are not being created, the issue is likely that the Stripe webhook is not properly configured.

## Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint URL is:
```
https://your-domain.com/api/stripe/webhook
```

Replace `your-domain.com` with your actual Vercel domain (e.g., `bruin-tutors.vercel.app` or your custom domain).

## Step 2: Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook endpoint URL: `https://your-domain.com/api/stripe/webhook`
5. Select events to listen to:
   - ✅ `checkout.session.completed` (REQUIRED)
   - Optionally: `payment_intent.succeeded`, `payment_intent.payment_failed`
6. Click **Add endpoint**

## Step 3: Get Webhook Signing Secret

1. After creating the webhook, click on it in the webhooks list
2. Click **Reveal** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)

## Step 4: Add Secret to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the webhook signing secret from Step 3
   - **Environment**: Production (and Preview if you want to test)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

## Step 5: Test the Webhook

1. Make a test payment on your site
2. Go to Stripe Dashboard → **Developers** → **Webhooks**
3. Click on your webhook endpoint
4. Check the **Events** tab to see if `checkout.session.completed` events are being received
5. Click on an event to see:
   - ✅ **Status**: Success (200) - webhook is working
   - ❌ **Status**: Failed - check the error message

## Troubleshooting

### Webhook not receiving events
- Verify the webhook URL is correct and accessible
- Check that the webhook is enabled in Stripe Dashboard
- Make sure you're using the **live** webhook secret if testing with live payments

### Webhook receiving events but calendar not created
- Check Vercel function logs for error messages
- Verify `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` are set in Vercel
- Verify `GOOGLE_REDIRECT_URI` matches your production domain
- Check that the tutor's `calendarConnected` is `true` in `data/tutors.json`
- Check that the tutor has a `bookingsCalendarId` set

### Signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel
- Make sure you're using the correct secret (test vs live)
- The secret should start with `whsec_`

## Important Notes

- **Test vs Live**: Make sure you're using the correct webhook secret:
  - Test mode: Use test webhook secret (from test mode webhook)
  - Live mode: Use live webhook secret (from live mode webhook)
- **Multiple Environments**: You may need separate webhooks for:
  - Production: `https://your-domain.com/api/stripe/webhook`
  - Preview: `https://your-preview-url.vercel.app/api/stripe/webhook`
- **Webhook Logs**: Always check Stripe Dashboard webhook logs for detailed error messages

