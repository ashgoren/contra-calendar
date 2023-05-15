import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import 'dotenv/config';

async function authorize() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });
  const client = await auth.getClient();
  return client;
}

export async function setupGoogleCalendarApi() {
  const auth = await authorize();
  return google.calendar({version: 'v3', auth});
}
