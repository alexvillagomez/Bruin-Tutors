import "dotenv/config";
import { google } from "googleapis";

import dotenv from "dotenv";
dotenv.config({ path: ".env" });


const calendarId = "c_583c4534816f205c724c2d4abea06ec151830d27661f69e3dffe2f3b8298a533@group.calendar.google.com";

async function main() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: "startTime",
  });

  console.log("Upcoming availability events:");
  res.data.items?.forEach((e) => {
    console.log(
      e.start?.dateTime || e.start?.date,
      "→",
      e.end?.dateTime || e.end?.date,
      "|",
      e.summary
    );
  });
}

main().catch(console.error);
