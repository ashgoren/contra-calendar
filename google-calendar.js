import { subDays } from 'date-fns';
const today = new Date();

export async function addEventsToGoogleCalendar({ builtEvents, calendarApi, calendarId }) {
  const existingEvents = await fetchExistingGoogleEvents({ calendarApi, calendarId });
  if (existingEvents.length > 0) { // google connection is working
    for (const event of builtEvents) {
      await new Promise(done => setTimeout(() => done(), 1000)); // rate limiting
      addGoogleEvent({ calendarApi, calendarId, existingEvents, event });
    }
  } else {
    throw new Error('No existing events found. Is this the right calendar?');
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

async function addGoogleEvent({ calendarApi, calendarId, existingEvents, event }) {
  const existingEvent = existingEvents.find(e => new Date(e.start.dateTime).getUTCDate() === new Date(event.start.dateTime).getUTCDate());
  if (existingEvent && existingEvent.summary === event.summary) {
    console.log('Skipping because event already exists', event);
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
