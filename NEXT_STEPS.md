# Next Steps: Stripe Integration

## ✅ What You've Done
- [x] Installed Stripe CLI
- [x] Added webhook secret to `.env.local`

## 🔄 Step 1: Start Stripe CLI Webhook Forwarding

Open a **new terminal window** and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You should see:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Keep this terminal window open** - it needs to stay running to forward webhooks.

## 🚀 Step 2: Start Your Dev Server

In your **main terminal** (or another terminal window):

```bash
cd "/Users/alexvillagomez/Desktop/Bruin Tutors"
npm run dev
```

Make sure your server is running on `http://localhost:3000`

## 💳 Step 3: Set Up Stripe Price IDs

You need to create products and prices in Stripe Dashboard:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products) (make sure you're in **Test mode**)
2. Click **"Add product"**
3. Create two products:

   **Product 1: 60-Minute Session**
   - Name: "60-Minute Tutoring Session"
   - Price: $50.00 USD
   - Billing: One time
   - Copy the **Price ID** (starts with `price_`)

   **Product 2: 90-Minute Session**
   - Name: "90-Minute Tutoring Session"
   - Price: $75.00 USD
   - Billing: One time
   - Copy the **Price ID** (starts with `price_`)

4. Update `app/api/stripe/checkout/route.ts`:

   Find this section (around line 20-25):
   ```typescript
   // TODO: Replace with your actual Stripe Price IDs
   const priceIdMap: Record<number, string> = {
     60: process.env.NEXT_PUBLIC_STRIPE_PRICE_60 || 'price_xxxxx',
     90: process.env.NEXT_PUBLIC_STRIPE_PRICE_90 || 'price_xxxxx',
   }
   ```

   Replace with your actual Price IDs:
   ```typescript
   const priceIdMap: Record<number, string> = {
     60: 'price_YOUR_60_MIN_PRICE_ID_HERE',
     90: 'price_YOUR_90_MIN_PRICE_ID_HERE',
   }
   ```

   **OR** add them to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PRICE_60=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_90=price_xxxxx
   ```

## 🧪 Step 4: Test the Webhook Connection

While both servers are running:

1. In the Stripe CLI terminal, trigger a test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

2. Check your Next.js server logs - you should see:
   ```
   Webhook event received: checkout.session.completed
   Payment successful! { sessionId: '...', ... }
   ```

3. If you see errors, check:
   - Is `STRIPE_WEBHOOK_SECRET` in `.env.local` matching the secret from `stripe listen`?
   - Did you restart the dev server after adding the webhook secret?
   - Is the webhook endpoint accessible?

## 💰 Step 5: Test the Full Payment Flow

1. Go to: `http://localhost:3000/book-now`
2. Complete the booking form:
   - Select session length (60 or 90 minutes)
   - Choose a tutor
   - Pick a time
   - Fill in student information
3. Click "Continue to Payment"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any CVC (e.g., 123)
   - Any ZIP (e.g., 12345)
6. Complete the payment
7. You should be redirected to `/payment/success`
8. Check your Stripe CLI terminal - you should see the webhook event
9. Check your Next.js server logs - you should see the webhook being processed

## 🔍 Step 6: Verify Everything Works

✅ **Checklist:**
- [ ] Stripe CLI is running and forwarding webhooks
- [ ] Dev server is running
- [ ] Price IDs are set in code or env vars
- [ ] Test webhook event works (`stripe trigger checkout.session.completed`)
- [ ] Full payment flow works end-to-end
- [ ] Webhook logs show successful processing

## 🐛 Troubleshooting

### Webhook not receiving events
- Make sure Stripe CLI is still running
- Check that `STRIPE_WEBHOOK_SECRET` matches the secret from `stripe listen`
- Restart dev server after updating `.env.local`

### "Price ID not configured" error
- Make sure you've set the Price IDs in `app/api/stripe/checkout/route.ts`
- Or set them in `.env.local` as `NEXT_PUBLIC_STRIPE_PRICE_60` and `NEXT_PUBLIC_STRIPE_PRICE_90`

### Payment redirects but webhook doesn't fire
- Check Stripe CLI is running
- Verify the webhook endpoint URL is correct
- Check server logs for errors

## 📝 Environment Variables Checklist

Make sure your `.env.local` has:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From stripe listen
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional (if not hardcoded in checkout route)
NEXT_PUBLIC_STRIPE_PRICE_60=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_90=price_xxxxx

# Google Calendar (if you're using it)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_REDIRECT_URI=...
APP_TIMEZONE=America/Los_Angeles
```

## 🎯 Quick Test

The fastest way to test:

1. Visit: `http://localhost:3000/pay?tutor=lauren-chen`
2. Click "Pay for Session"
3. Complete payment with test card `4242 4242 4242 4242`
4. Check webhook logs

This bypasses the full booking flow and goes straight to payment.

