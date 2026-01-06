/**
 * Generate a Google OAuth refresh token for the scheduler account.
 *
 * Usage:
 *  1) Ensure env vars are set:
 *     GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 *  2) Run:
 *     npx tsx scripts/google-refresh-token.ts
 *  3) Open the printed URL, log in as bruintutors.scheduling@gmail.com,
 *     approve, copy the "code" param, paste it back into the terminal.
 *
 * Notes:
 * - You MUST be using an OAuth Client of type "Web application"
 * - You MUST add the redirect URI in Google Cloud Console exactly as in env var
 */

import "dotenv/config";
import { google } from "googleapis";
import readline from "node:readline";

import dotenv from "dotenv";
// Load .env.local first (takes precedence), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });


function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const CLIENT_ID = requireEnv("GOOGLE_CALENDAR_CLIENT_ID");
  const CLIENT_SECRET = requireEnv("GOOGLE_CALENDAR_CLIENT_SECRET");
  const REDIRECT_URI = requireEnv("GOOGLE_REDIRECT_URI");

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // Full read/write for Calendar so your backend can create booking events.
  const SCOPES = ["https://www.googleapis.com/auth/calendar"];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",      // REQUIRED for refresh token
    prompt: "consent",           // Forces refresh_token even if previously approved (usually)
    scope: SCOPES,
    response_type: "code",       // Explicitly set response_type
  });

  // Validate the URL contains required parameters
  if (!authUrl.includes("response_type=code")) {
    console.error("❌ ERROR: Generated auth URL is missing response_type parameter!");
    console.error("This may indicate an issue with the googleapis library.");
    process.exitCode = 1;
    return;
  }

  console.log("\n📋 Configuration Check:");
  console.log("  Client ID:", CLIENT_ID.substring(0, 20) + "...");
  console.log("  Redirect URI:", REDIRECT_URI);
  console.log("\n⚠️  IMPORTANT: Make sure this redirect URI is EXACTLY added in Google Cloud Console:");
  console.log("  1. Go to https://console.cloud.google.com/apis/credentials");
  console.log("  2. Find your OAuth 2.0 Client ID");
  console.log("  3. Under 'Authorized redirect URIs', ensure this URI is listed:");
  console.log("     " + REDIRECT_URI);
  console.log("\n1) Open this URL in an incognito window:\n");
  console.log(authUrl);
  console.log("\n2) Log in as: bruintutors.scheduling@gmail.com");
  console.log("3) Approve permissions");
  console.log("4) You will be redirected to your REDIRECT_URI with ?code=...");
  console.log("5) Copy the code and paste it below.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Paste code here: ", async (code) => {
    rl.close();

    try {
      const { tokens } = await oauth2Client.getToken(code.trim());

      // tokens.refresh_token is the main thing you need
      console.log("\n✅ Tokens received.");
      console.log("Access token present:", Boolean(tokens.access_token));
      console.log("Refresh token present:", Boolean(tokens.refresh_token));

      if (!tokens.refresh_token) {
        console.log("\n⚠️ No refresh_token returned.");
        console.log("This usually means the account already authorized this OAuth client before.");
        console.log("Fix:");
        console.log("  - Go to Google Account (bruintutors.scheduling@gmail.com) → Security → Third-party access");
        console.log("  - Remove access for your app");
        console.log("  - Re-run this script (keep prompt:'consent')");
      } else {
        console.log("\n🔑 GOOGLE_REFRESH_TOKEN:\n");
        console.log(tokens.refresh_token);
        console.log("\nStore it in your .env.local / Vercel env vars as GOOGLE_REFRESH_TOKEN.");
      }
    } catch (err: any) {
      console.error("\n❌ Error exchanging code for tokens:");
      console.error(err?.message || err);
      process.exitCode = 1;
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
