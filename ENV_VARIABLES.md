# Environment Variables Reference

This document lists all environment variables used in the Bruin Tutors application.

## Authentication (NextAuth.js)

These credentials are used for user authentication (login/signup):

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Note**: Create these OAuth credentials in Google Cloud Console with the redirect URI: `http://localhost:3000/api/auth/callback/google`

## Google Calendar API

These credentials are used for calendar operations (fetching availability, creating bookings):

```env
GOOGLE_CALENDAR_CLIENT_ID="your-google-calendar-client-id.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="your-google-calendar-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
GOOGLE_REFRESH_TOKEN="your-google-refresh-token"
```

**Note**: These are separate from the NextAuth credentials. You can use the same OAuth client for both, but they must be stored in separate environment variables. The redirect URI for calendar operations is: `http://localhost:3000/oauth2callback`

## Database

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

## Application Settings

```env
APP_TIMEZONE="America/Los_Angeles"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Stripe

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Email (Resend API)

```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="onboarding@resend.dev"
CONTACT_EMAIL="alexvillagomeztutoring@gmail.com"
```

## Migration Notes

If you're migrating from the old naming convention:
- `GOOGLE_CLIENT_ID` (for calendar) → `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (for calendar) → `GOOGLE_CALENDAR_CLIENT_SECRET`

The NextAuth credentials remain as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

