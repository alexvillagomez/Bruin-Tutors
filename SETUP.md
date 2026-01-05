# Google Calendar Scheduling System Setup

This document explains how to set up the Google Calendar-based scheduling system for Bruin Tutors.

## Overview

The scheduling system uses Google Calendar API to manage tutor availability and bookings. Each tutor maintains two calendars that are shared with the scheduler account (`bruintutors.scheduling@gmail.com`).

## Architecture

- **Scheduler Account**: `bruintutors.scheduling@gmail.com` - This account authenticates with Google Calendar API and reads/writes to all shared tutor calendars
- **Tutor Calendars**: Each tutor has two calendars:
  1. **"Bruin Tutors — Availability"**: Events represent availability windows (ANY event = available)
  2. **"Bruin Tutors — Bookings"**: System writes booked sessions here

## Setup Steps

### 1. Create Google Cloud Project and OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: Add your redirect URI (e.g., `http://localhost:3000/api/auth/callback`)
   - Save the Client ID and Client Secret

### 2. Obtain Refresh Token for Scheduler Account

You need to obtain a refresh token for `bruintutors.scheduling@gmail.com`:

1. Use the OAuth 2.0 Playground or a script to authenticate:
   ```bash
   # Install google-auth-library if needed
   npm install google-auth-library
   ```

2. Run an OAuth flow to get the refresh token. You can use a script like this:
   ```javascript
   const { google } = require('googleapis');
   const readline = require('readline');
   
   const oauth2Client = new google.auth.OAuth2(
     'YOUR_CLIENT_ID',
     'YOUR_CLIENT_SECRET',
     'YOUR_REDIRECT_URI'
   );
   
   const scopes = ['https://www.googleapis.com/auth/calendar'];
   
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: scopes,
   });
   
   console.log('Authorize this app by visiting this url:', authUrl);
   
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
   });
   
   rl.question('Enter the code from that page here: ', (code) => {
     rl.close();
     oauth2Client.getToken(code, (err, token) => {
       if (err) return console.error('Error retrieving access token', err);
       console.log('Refresh token:', token.refresh_token);
     });
   });
   ```

3. Save the refresh token - you'll need it for the environment variable

### 3. Set Up Tutor Calendars

For each tutor:

1. **Create Availability Calendar**:
   - In Google Calendar, create a new calendar named "Bruin Tutors — Availability"
   - Add events to represent when the tutor is available
   - ANY event on this calendar = available time slot
   - Example: Create an event from 10:00 AM - 2:00 PM = tutor is available during that window

2. **Create Bookings Calendar**:
   - Create another calendar named "Bruin Tutors — Bookings"
   - This calendar will be populated automatically by the system

3. **Share Both Calendars**:
   - For each calendar, click the three dots > "Settings and sharing"
   - Under "Share with specific people", add: `bruintutors.scheduling@gmail.com`
   - Set permission to "Make changes to events"
   - Click "Send"

### 4. Get Calendar IDs

1. Go to Google Calendar settings
2. Click on the calendar you want the ID for
3. Scroll down to "Integrate calendar"
4. Copy the "Calendar ID" (it looks like an email address, e.g., `abc123@group.calendar.google.com`)

### 5. Update Tutor Data

Edit `data/tutors.json` and add the calendar IDs:

```json
{
  "id": "alex",
  "displayName": "Alex",
  "subjects": ["AP Calculus AB", "AP Calculus BC", "AP Physics 1", "AP Physics C"],
  "blurb": "UCLA junior majoring in Physics. 4 years tutoring experience.",
  "availabilityCalendarId": "YOUR_AVAILABILITY_CALENDAR_ID_HERE",
  "bookingsCalendarId": "YOUR_BOOKINGS_CALENDAR_ID_HERE",
  "isActive": true,
  "sortOrder": 1
}
```

### 6. Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
APP_TIMEZONE=America/Los_Angeles
```

**Important**: Never commit `.env.local` to version control. Add it to `.gitignore`.

### 7. Install Dependencies

```bash
npm install
```

This will install `googleapis` and other dependencies.

## How It Works

### Availability Generation

1. System fetches events from the tutor's "Availability" calendar for the next 14 days
2. Each event represents an availability window
3. System generates 15-minute increment slots that fit within each window
4. System fetches existing bookings from the "Bookings" calendar
5. Slots that overlap with bookings are removed
6. Remaining slots are returned to the client

### Booking Process

1. User selects a session length (60/90/15 minutes) and tutor
2. System shows available time slots
3. User fills out booking form
4. System validates the slot is still available
5. System creates a booking event in the "Bookings" calendar
6. System creates a mirrored event in the "Availability" calendar (to block the time)
7. Booking ID is stored in event's extended properties

## Adding New Tutors

1. Create the two calendars for the new tutor
2. Share both calendars with `bruintutors.scheduling@gmail.com` with "Make changes" permission
3. Get the calendar IDs
4. Add a new entry to `data/tutors.json`:
   ```json
   {
     "id": "tutor-slug",
     "displayName": "Tutor Name",
     "subjects": ["AP Subject 1", "AP Subject 2"],
     "blurb": "Brief description",
     "availabilityCalendarId": "calendar_id_here",
     "bookingsCalendarId": "calendar_id_here",
     "isActive": true,
     "sortOrder": 2
   }
   ```

## Troubleshooting

### "Missing required Google OAuth environment variables"
- Check that all environment variables are set in `.env.local`
- Restart the dev server after adding environment variables

### "Failed to fetch availability"
- Verify the calendar IDs are correct
- Check that calendars are shared with `bruintutors.scheduling@gmail.com`
- Verify the refresh token is valid
- Check Google Cloud Console that Calendar API is enabled

### "Tutor not found or inactive"
- Check `data/tutors.json` that the tutor exists and `isActive` is `true`

### No availability showing
- Ensure the tutor has events in their "Availability" calendar
- Check that events are within the next 14 days
- Verify timezone is set correctly (America/Los_Angeles)

## Security Notes

- Keep OAuth credentials secure
- Never commit `.env.local` to version control
- The refresh token allows full access to shared calendars - keep it secure
- Consider using environment-specific credentials for production

## Future Enhancements

- Migrate tutor data to a database (Prisma/PostgreSQL)
- Add Stripe payment integration
- Add email notifications for bookings
- Add calendar sync for Zoom links
- Add cancellation/rescheduling functionality

