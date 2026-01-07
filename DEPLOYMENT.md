# Deployment Guide: Deploying to Your Custom Domain

This guide will walk you through deploying your Bruin Tutors website to your custom domain using Vercel.

## Prerequisites

- Your code is already pushed to GitHub (✅ Done)
- You have a Vercel account connected to your GitHub repository (✅ Done)
- You have a domain name from Namecheap (or another registrar)

## Step 1: Verify Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your "Bruin Tutors" project
3. Verify the latest deployment is successful
4. Note your current Vercel domain (e.g., `bruin-tutors.vercel.app`)

## Step 2: Configure Your Domain in Vercel

1. In your Vercel project, go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain name (e.g., `yourdomain.com` or `www.yourdomain.com`)
4. Vercel will show you the DNS records you need to add

## Step 3: Configure DNS in Namecheap

1. Log in to your [Namecheap account](https://www.namecheap.com/)
2. Go to **Domain List** → Click **Manage** next to your domain
3. Go to the **Advanced DNS** tab
4. Add the DNS records that Vercel provided:

### For Root Domain (yourdomain.com):
- **Type**: `A`
- **Host**: `@`
- **Value**: Vercel's IP address (Vercel will provide this)
- **TTL**: Automatic (or 300)

### For WWW Subdomain (www.yourdomain.com):
- **Type**: `CNAME`
- **Host**: `www`
- **Value**: `cname.vercel-dns.com` (or the CNAME Vercel provides)
- **TTL**: Automatic (or 300)

**Note**: Vercel will show you the exact values to use. Copy them exactly.

## Step 4: Update Environment Variables

Make sure all environment variables are set in Vercel:

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Verify these are set for **Production**:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (update this to use your custom domain: `https://yourdomain.com/api/auth/callback`)
   - `GOOGLE_REFRESH_TOKEN`
   - `STRIPE_SECRET_KEY` (live key)
   - `STRIPE_WEBHOOK_SECRET` (live webhook secret)
   - `NEXT_PUBLIC_BASE_URL` (set to `https://yourdomain.com`)
   - `APP_TIMEZONE` (optional, defaults to `America/Los_Angeles`)

3. **Important**: Update `GOOGLE_REDIRECT_URI` to match your custom domain
4. **Important**: Update `NEXT_PUBLIC_BASE_URL` to your custom domain

## Step 5: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   - `https://yourdomain.com/api/auth/callback`
   - Keep the existing localhost URI for development
5. Click **Save**

## Step 6: Update Stripe Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click on your webhook endpoint
4. Update the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
5. Or create a new webhook with your custom domain URL
6. Copy the new webhook signing secret
7. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

## Step 7: Wait for DNS Propagation

- DNS changes can take 24-48 hours to propagate globally
- Usually works within a few hours
- You can check propagation status at [whatsmydns.net](https://www.whatsmydns.net)

## Step 8: Verify SSL Certificate

- Vercel automatically provisions SSL certificates for your domain
- This usually happens within a few minutes after DNS is configured
- Check in Vercel → Settings → Domains to see SSL status

## Step 9: Test Your Deployment

1. Visit your custom domain (e.g., `https://yourdomain.com`)
2. Test the booking flow
3. Verify calendar events are created
4. Test Stripe payments (use test mode first, then switch to live)
5. Check that all environment variables are working

## Troubleshooting

### Domain Not Resolving
- Wait 24-48 hours for DNS propagation
- Verify DNS records are correct in Namecheap
- Check Vercel domain settings show "Valid Configuration"

### SSL Certificate Issues
- Wait a few minutes after DNS is configured
- Vercel automatically provisions SSL certificates
- If issues persist, contact Vercel support

### Environment Variables Not Working
- Make sure variables are set for **Production** environment
- Redeploy after adding/updating environment variables
- Check Vercel function logs for errors

### Google OAuth Not Working
- Verify redirect URI matches exactly in Google Cloud Console
- Check that `GOOGLE_REDIRECT_URI` in Vercel matches your domain
- May need to regenerate refresh token if redirect URI changed

### Stripe Webhook Not Working
- Verify webhook URL is correct in Stripe dashboard
- Check webhook secret matches in Vercel
- Test webhook in Stripe dashboard → Webhooks → Send test webhook

## Additional Resources

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Namecheap DNS Setup Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-configure-dns-for-a-domain/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project connected to GitHub
- [ ] Domain added in Vercel
- [ ] DNS records configured in Namecheap
- [ ] Environment variables updated in Vercel
- [ ] Google OAuth redirect URI updated
- [ ] Stripe webhook URL updated
- [ ] DNS propagated (check with whatsmydns.net)
- [ ] SSL certificate active
- [ ] Test booking flow
- [ ] Test payment flow
- [ ] Test calendar event creation

