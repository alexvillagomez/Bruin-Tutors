import { google } from 'googleapis'

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

let authClient: any = null

export function getGoogleAuthClient() {
  if (authClient) {
    return authClient
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    throw new Error('Missing required Google Calendar OAuth environment variables')
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  authClient = oauth2Client
  return authClient
}

export function getCalendarClient() {
  const auth = getGoogleAuthClient()
  return google.calendar({ version: 'v3', auth })
}

export async function getCalendarEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const calendar = getCalendarClient()
  
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      singleEvents: true,
      orderBy: 'startTime'
    })

    return response.data.items || []
  } catch (error: any) {
    console.error('Error fetching calendar events:', {
      calendarId,
      error: error.message,
      code: error.code,
      response: error.response?.data
    })
    
    // Check for OAuth token issues
    if (error.response?.data?.error === 'invalid_grant') {
      throw new Error('GOOGLE_OAUTH_TOKEN_EXPIRED: The Google OAuth refresh token has expired or been revoked. Please regenerate it using: npx tsx scripts/google-refresh-token.ts')
    }
    
    // Provide more helpful error messages
    if (error.code === 404) {
      throw new Error(`Calendar not found. Please check that the calendar ID is correct and the calendar is shared with bruintutors.scheduling@gmail.com`)
    } else if (error.code === 403) {
      throw new Error(`Access denied. Please ensure the calendar is shared with bruintutors.scheduling@gmail.com with "Make changes to events" permission`)
    }
    
    throw error
  }
}

export async function createCalendarEvent(
  calendarId: string,
  event: {
    summary: string
    description: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    attendees?: Array<{ email: string; displayName?: string }>
    extendedProperties?: {
      private?: Record<string, string>
    }
  },
  options?: {
    sendUpdates?: 'all' | 'externalOnly' | 'none'
  }
) {
  const calendar = getCalendarClient()
  
  try {
    console.log('Creating calendar event:', {
      calendarId,
      summary: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      attendees: event.attendees?.map(a => a.email),
      sendUpdates: options?.sendUpdates || 'all',
    })

    // Build the event request body
    const requestBody: any = {
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
    }

    // Add attendees if provided
    if (event.attendees && event.attendees.length > 0) {
      requestBody.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
      }))
    }

    // Add extended properties if provided
    if (event.extendedProperties) {
      requestBody.extendedProperties = event.extendedProperties
    }

    // Insert the event with sendUpdates to send invites
    const response = await calendar.events.insert({
      calendarId,
      requestBody,
      sendUpdates: options?.sendUpdates || 'all', // Send invites to all attendees
    })

    console.log('✅ Calendar event created successfully:', {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      calendarId,
      attendees: response.data.attendees?.map((a: any) => a.email),
    })

    return response.data
  } catch (error: any) {
    console.error('❌ Error creating calendar event:', {
      error: error.message,
      code: error.code,
      calendarId,
      response: error.response?.data,
    })
    
    // Provide more helpful error messages
    if (error.code === 404) {
      throw new Error(`Calendar not found: ${calendarId}. Please check that the calendar ID is correct.`)
    } else if (error.code === 403) {
      throw new Error(`Access denied to calendar: ${calendarId}. Please ensure the calendar is shared with bruintutors.scheduling@gmail.com with "Make changes to events" permission.`)
    }
    
    throw error
  }
}

