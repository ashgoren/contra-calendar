import { subDays } from 'date-fns';
import { formatDateTimes } from './utils.js';
const today = new Date();

export async function addEventsToGoogleCalendar({ googleEvents, calendarApi, calendarId }) {
  const existingEvents = await fetchExistingGoogleEvents({ calendarApi, calendarId });
  // if (!existingEvents.length) throw new Error(`No existing events found in ${calendarId}. Did something go wrong?`);
  for (const event of googleEvents) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // rate limiting
    await addOrUpdateGoogleEvent({ calendarApi, calendarId, existingEvents, event });
  }
}

async function fetchExistingGoogleEvents({ calendarApi, calendarId }) {
  const response = await calendarApi.events.list({
    calendarId,
    timeMin: subDays(today, 1).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

async function addOrUpdateGoogleEvent({ calendarApi, calendarId, existingEvents, event }) {
  const existingEvent = existingEvents.find(e => new Date(e.start.dateTime).getUTCDate() === new Date(event.start.dateTime).getUTCDate());
  if (existingEvent && existingEvent.summary === event.summary) {
    console.log('Skipping because event already exists', formatDateTimes(event.start.dateTime, event.end.dateTime));
    return;
  } else if (existingEvent) {
    await calendarApi.events.update({
      calendarId,
      eventId: existingEvent.id,
      resource: event,
    });
    console.log(`Event updated: ${existingEvent.htmlLink}`);
  } else {
    const response = await calendarApi.events.insert({
      calendarId,
      resource: event,
    });
    console.log(`Event created: ${response.data.htmlLink}`);
  }
}
