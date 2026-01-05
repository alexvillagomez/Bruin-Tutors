# Authentication & Dashboard Setup (Phase 1)

This document outlines the setup instructions for the client login and dashboard system.

## Overview

Phase 1 implements:
- ✅ User authentication with NextAuth.js (Google OAuth)
- ✅ PostgreSQL database with Prisma
- ✅ Protected `/dashboard` page
- ✅ User profile storage (name, email, phone, timezone)
- ✅ Login/logout functionality in header

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database. Options:
   - **Local**: Install PostgreSQL locally
   - **Neon** (Recommended for Vercel): https://neon.tech (free tier available)
   - **Supabase**: https://supabase.com (free tier available)
   - **Vercel Postgres**: Available in Vercel dashboard

2. **Google OAuth Credentials**: 
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (for local)
   - For production, add: `https://yourdomain.com/api/auth/callback/google`

## Environment Variables

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bruin_tutors"
# Or for Neon: postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET="your-random-secret-here"
# Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
# For production: https://yourdomain.com

# Google OAuth (for NextAuth sign-in)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Note**: The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for NextAuth are separate from your Google Calendar API credentials. The calendar uses `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET`. You can use the same OAuth credentials for both, but they must be stored in separate environment variables. If using the same credentials, make sure the authorized redirect URIs include both:
- `http://localhost:3000/api/auth/callback/google` (for NextAuth)
- `http://localhost:3000/oauth2callback` (for Calendar API)

## Database Setup

1. **Run Prisma migrations** to create the database tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database tables (User, Account, Session, VerificationToken, Profile)
- Generate the Prisma Client

2. **Verify the database**:

```bash
npx prisma studio
```

This opens a browser interface to view your database tables.

## Running the Application

1. **Install dependencies** (if not already done):

```bash
npm install
```

2. **Generate Prisma Client** (if needed):

```bash
npx prisma generate
```

3. **Start the development server**:

```bash
npm run dev
```

4. **Test the authentication**:
   - Navigate to `http://localhost:3000/login`
   - Click "Continue with Google"
   - Sign in with your Google account
   - You should be redirected to `/dashboard`

## Features

### Login Page (`/login`)
- Google OAuth sign-in
- Placeholder for email magic link (TODO)

### Dashboard (`/dashboard`)
- Protected route (requires authentication)
- Displays user information
- Shows placeholder sections for:
  - Upcoming Sessions
  - Past Sessions
- "Book a Session" button linking to `/book-now`

### Header
- Shows "Sign In" button when logged out
- Shows "Dashboard" link and "Sign Out" button when logged in
- Responsive design for mobile devices

## Database Schema

The Prisma schema includes:

- **User**: Core user information (name, email, image)
- **Account**: OAuth account connections (Google)
- **Session**: User sessions (database strategy)
- **VerificationToken**: Email verification tokens (for future email auth)
- **Profile**: Extended user profile (phone, timezone)

## Next Steps (Future Phases)

- Phase 2: Store bookings in database and link to users
- Phase 3: Implement reschedule and refund functionality
- Email magic link authentication (currently TODO)

## Troubleshooting

### "Invalid credentials" error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct (for NextAuth)
- Verify `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` are correct (for Calendar API)
- Check that redirect URI matches in Google Cloud Console

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure database is running and accessible
- Check SSL mode if using cloud database (add `?sslmode=require`)

### "NEXTAUTH_SECRET is missing"
- Generate a secret: `openssl rand -base64 32`
- Add to `.env.local`

### Prisma Client not found
- Run `npx prisma generate`
- Ensure `DATABASE_URL` is set before generating

## Files Changed/Added

### New Files
- `lib/auth.ts` - NextAuth configuration
- `lib/auth-helpers.ts` - Server-side auth helpers
- `lib/prisma.ts` - Prisma client singleton
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `app/login/page.tsx` - Login page
- `app/login/page.module.css` - Login page styles
- `app/dashboard/page.tsx` - Dashboard page
- `app/dashboard/page.module.css` - Dashboard styles
- `components/Providers.tsx` - SessionProvider wrapper
- `middleware.ts` - Route protection middleware
- `prisma/schema.prisma` - Database schema
- `prisma.config.ts` - Prisma configuration

### Modified Files
- `components/Header.tsx` - Added login/logout buttons
- `components/Header.module.css` - Updated styles for auth buttons
- `app/layout.tsx` - Added SessionProvider wrapper
- `package.json` - Added NextAuth and Prisma dependencies

