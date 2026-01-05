# Debugging Google Calendar Integration

If you're seeing "Failed to load available times" or "No available times", follow this checklist:

## Step 1: Test Calendar Access

Visit this URL in your browser (replace with your dev server URL):
```
http://localhost:3000/api/test-calendar?tutorId=alex
```

This will show you:
- ✅ If calendars are accessible
- ❌ Specific error messages if access fails
- Event counts from each calendar

**What to look for:**
- If `availability.success` is `false`, check the error message
- If `bookings.success` is `false`, check the error message
- If both are `true` but `eventCount` is 0, you need to add events to your availability calendar

## Step 2: Check Environment Variables

Make sure your `.env.local` file has all required variables:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
APP_TIMEZONE=America/Los_Angeles
```

**Common issues:**
- Missing `.env.local` file (create it in the project root)
- Variables not loaded (restart dev server after adding/changing)
- Wrong values (double-check each one)

## Step 3: Verify Calendar Sharing

### For Availability Calendar:
1. Go to Google Calendar
2. Find your "Bruin Tutors — Availability" calendar (or the calendar with ID: `c_583c4534816f205c724c2d4abea06ec151830d27661f69e3dffe2f3b8298a533@group.calendar.google.com`)
3. Click the three dots (⋮) next to the calendar name
4. Select "Settings and sharing"
5. Scroll to "Share with specific people"
6. Verify `bruintutors.scheduling@gmail.com` is listed
7. **Permission must be "Make changes to events"** (not just "See all event details")

### For Bookings Calendar:
1. Go to Google Calendar
2. Find your primary calendar (alexvillagomez1@g.ucla.edu) OR create a separate "Bruin Tutors — Bookings" calendar
3. Follow the same sharing steps above
4. **Important:** If using your primary calendar, make sure it's shared with the scheduler account

## Step 4: Check Calendar IDs

In `data/tutors.json`, verify the calendar IDs are correct:

```json
{
  "availabilityCalendarId": "c_583c4534816f205c724c2d4abea06ec151830d27661f69e3dffe2f3b8298a533@group.calendar.google.com",
  "bookingsCalendarId": "alexvillagomez1@g.ucla.edu"
}
```

**How to find calendar IDs:**
1. Go to Google Calendar settings
2. Click on the calendar you want
3. Scroll to "Integrate calendar"
4. Copy the "Calendar ID"

**Note:** For primary calendars, you can use the email address format. For secondary calendars, use the full calendar ID.

## Step 5: Add Events to Availability Calendar

**This is likely the issue!** The system treats ANY event on the availability calendar as an "available window."

**How to set availability:**
1. Open your "Bruin Tutors — Availability" calendar
2. Create an event (e.g., "Available")
3. Set the start time (e.g., 10:00 AM)
4. Set the end time (e.g., 2:00 PM)
5. Save the event

**Example:**
- Event: "Available Monday"
- Start: Monday, 10:00 AM
- End: Monday, 2:00 PM
- Result: System will generate slots from 10:00 AM to 2:00 PM

**The system will:**
- Generate 15-minute increment slots within each availability window
- Filter out slots that overlap with bookings
- Show slots for the next 14 days

## Step 6: Check OAuth Refresh Token

The refresh token must be valid and not expired.

**To get a new refresh token:**
1. Run the script: `scripts/google-refresh-token.ts`
2. Follow the OAuth flow
3. Copy the refresh token
4. Update `.env.local`

**Common issues:**
- Refresh token expired (get a new one)
- Wrong refresh token (double-check it's for bruintutors.scheduling@gmail.com)
- Token doesn't have Calendar API scope

## Step 7: Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab:** Look for error messages
2. **Network tab:** Check the `/api/availability` request
   - Status code (should be 200)
   - Response body (should show error details)

## Step 8: Check Server Logs

In your terminal where `npm run dev` is running, look for:
- Error messages from Google Calendar API
- Specific error codes (404, 403, 401, etc.)
- Calendar access errors

## Common Error Messages & Solutions

### "Calendar not found"
- **Cause:** Calendar ID is incorrect
- **Fix:** Verify calendar ID in `data/tutors.json`

### "Access denied" or 403 error
- **Cause:** Calendar not shared or wrong permissions
- **Fix:** Share calendar with `bruintutors.scheduling@gmail.com` with "Make changes" permission

### "Invalid credentials" or 401 error
- **Cause:** Refresh token expired or invalid
- **Fix:** Get a new refresh token

### "No available times" (but no error)
- **Cause:** No events in availability calendar OR all slots are booked
- **Fix:** Add events to your availability calendar

### "Failed to fetch availability"
- **Cause:** Network issue or API error
- **Fix:** Check server logs for specific error

## Quick Test Checklist

- [ ] `.env.local` exists with all required variables
- [ ] Dev server restarted after adding env variables
- [ ] Availability calendar shared with bruintutors.scheduling@gmail.com
- [ ] Bookings calendar shared with bruintutors.scheduling@gmail.com
- [ ] Both calendars have "Make changes" permission
- [ ] Calendar IDs are correct in `data/tutors.json`
- [ ] Events exist in availability calendar (for next 14 days)
- [ ] `/api/test-calendar?tutorId=alex` returns success
- [ ] Browser console shows no errors
- [ ] Server logs show no errors

## Still Having Issues?

1. Run the test endpoint: `http://localhost:3000/api/test-calendar?tutorId=alex`
2. Copy the full error message
3. Check server logs for detailed errors
4. Verify all steps above

The most common issue is **not having events in the availability calendar**. Remember: ANY event on that calendar = available time window!

