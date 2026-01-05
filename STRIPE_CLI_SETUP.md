# Stripe CLI Setup Guide

## 📥 Installation

### macOS (using Homebrew - Recommended)

```bash
brew install stripe/stripe-cli/stripe
```

### macOS (Manual)

1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_macOS_arm64.tar.gz` (for Apple Silicon) or `stripe_X.X.X_macOS_x86_64.tar.gz` (for Intel)
3. Extract and move to `/usr/local/bin`:
   ```bash
   tar -xzf stripe_X.X.X_macOS_arm64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

### Windows

1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip`
3. Extract and add to PATH, or run from the extracted folder

### Linux

```bash
# Download and install
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xzf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

## 🔐 Login to Stripe

1. Open terminal
2. Run:
   ```bash
   stripe login
   ```
3. This will open your browser to authenticate
4. Click "Allow access" in the browser
5. You should see "Done! The Stripe CLI is configured for your account"

## 🧪 Testing Webhooks Locally

### Step 1: Start Your Next.js Dev Server

In one terminal window:
```bash
cd "/Users/alexvillagomez/Desktop/Bruin Tutors"
npm run dev
```

Your server should be running on `http://localhost:3000`

### Step 2: Forward Webhooks to Your Local Server

In a **second terminal window**, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You should see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 3: Copy the Webhook Secret

Copy the `whsec_xxxxxxxxxxxxx` value and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** This secret is different for each `stripe listen` session. If you restart the CLI, you'll get a new secret.

### Step 4: Restart Your Dev Server

After adding the webhook secret, restart your Next.js dev server:
```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

## 🧪 Testing the Webhook

### Option 1: Trigger a Test Event

In the terminal where `stripe listen` is running, you can trigger test events:

```bash
# Test checkout.session.completed event
stripe trigger checkout.session.completed
```

This will send a test event to your webhook endpoint. Check your Next.js server logs to see if it was received.

### Option 2: Complete a Real Test Payment

1. Go to your booking page: `http://localhost:3000/book-now`
2. Complete the booking form
3. Use a test card: `4242 4242 4242 4242`
4. Complete the payment on Stripe Checkout
5. Watch both terminals:
   - Stripe CLI will show the webhook event being forwarded
   - Your Next.js server logs will show the webhook being processed

## 📋 Common Commands

### View All Events
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-json
```

### Filter Specific Events
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed
```

### View Recent Events (without forwarding)
```bash
stripe events list
```

### View Event Details
```bash
stripe events retrieve evt_xxxxxxxxxxxxx
```

## 🔍 Troubleshooting

### "Command not found: stripe"
- Make sure Stripe CLI is installed and in your PATH
- Try: `which stripe` to see if it's found
- On macOS, you may need to restart your terminal after installation

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from `stripe listen`
- Restart your dev server after updating the secret
- The secret changes each time you run `stripe listen`

### "Connection refused" or "Failed to forward"
- Make sure your Next.js dev server is running on port 3000
- Check that the URL is correct: `localhost:3000/api/stripe/webhook`
- Try using `127.0.0.1:3000` instead of `localhost:3000`

### Webhook not receiving events
- Check that `stripe listen` is still running
- Verify the webhook endpoint URL is correct
- Check your Next.js server logs for errors
- Make sure the webhook route is accessible (try visiting it in browser - should return an error about missing signature, which is expected)

## 🚀 Production Webhook Setup

For production, you don't use Stripe CLI. Instead:

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your production environment variables (Vercel, etc.)

## 💡 Pro Tips

1. **Keep Stripe CLI running**: Leave `stripe listen` running in a separate terminal while developing
2. **Use test mode**: Make sure you're using test API keys (`sk_test_...`) in development
3. **Check logs**: Watch both your Next.js server logs and Stripe CLI output to debug issues
4. **Test cards**: Use Stripe's test card numbers for testing payments without real charges

## 📚 Additional Resources

- Stripe CLI Docs: https://stripe.com/docs/stripe-cli
- Test Cards: https://stripe.com/docs/testing
- Webhook Guide: https://stripe.com/docs/webhooks

