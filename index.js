import { setupGoogleCalendarApi } from './google-auth.js';
import { addEventsToGoogleCalendar } from './google-calendar.js';
import { confirmAction, logEvents } from './utils.js';
import { LOCATIONS } from './config.js';

try {
  runApplication();
} catch (err) {
  console.error(err);
  process.exit(1); // abandon ship!
}

async function runApplication() {
  const calendarApi = await setupGoogleCalendarApi();
  for (const config of Object.values(LOCATIONS)) {
    await handleLocation({ calendarApi, config });
  }
}

async function handleLocation({ calendarApi, config }) {
  // scrape events
  console.log(`\n\n\n****************************\nScraping ${config.name}...`)
  let scrapedEvents;
  try {
    scrapedEvents = await config.scrapeFunction(config);
  } catch (err) {
    console.error(`Error scraping ${config.name}: ${err}`);
    throw err;
  }

  // build google-compatible events
  const googleEvents = buildEvents({ scrapedEvents, config });
  
  // add or update google calendar events
  if (googleEvents.length > 0) {
    logEvents({ events: googleEvents, name: config.name });
  } else {
    throw new Error(`No events found for ${config.name}`);
  }
  if (!process.env.LOCAL || await confirmAction(`Do the above scraped events look correct for ${config.name}?`)) {
    try {
      await addEventsToGoogleCalendar({
        googleEvents,
        calendarApi,
        calendarId: config.calendarId
      });
    } catch (err) {
      console.error(`Error adding events to ${config.name} calendar: ${err}`);
      throw err;
    }
  } else {
    console.log(`\n\nSkipped adding events to ${config.name} calendar\n\n`);
  }
}

// Build events compatible with Google Calendar
function buildEvents({ scrapedEvents, config }) {
  return scrapedEvents.map(({ summary, startDateTime, endDateTime, location, description, url }) => ({
    'summary': `[${config.shortName}] ${summary}`,
    'location': location || config.address,
    'description': description ? `${description}\n\n${url}` : config.url,
    'guestsCanSeeOtherGuests': false,
    'transparency': 'transparent',
    'start': {
      'dateTime': startDateTime,
      'timeZone': 'America/Los_Angeles'
    },
    'end': {
      'dateTime': endDateTime,
      'timeZone': 'America/Los_Angeles'
    }
  }));
}
