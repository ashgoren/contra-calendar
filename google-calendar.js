import { subDays } from 'date-fns';
const today = new Date();

export async function addEventsToGoogleCalendar({ googleEvents, calendarApi, calendarId }) {
  const existingEvents = await fetchExistingGoogleEvents({ calendarApi, calendarId });
  if (!existingEvents.length) {
    // throw new Error(`No existing events found in ${calendarId}. Did something go wrong?`);
    console.warn(`No existing events found in ${calendarId}. Did something go wrong?`);
  }
  for (const event of googleEvents) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // rate limiting
    await addOrUpdateGoogleEvent({ calendarApi, calendarId, existingEvents, event });
  }
}

async function fetchExistingGoogleEvents({ calendarApi, calendarId }) {
  const response = await calendarApi.events.list({
    calendarId,
    timeMin: subDays(today, 2).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

async function addOrUpdateGoogleEvent({ calendarApi, calendarId, existingEvents, event }) {
  const existingEvent = existingEvents.find(e => new Date(e.start.dateTime).toLocaleDateString() === new Date(event.start.dateTime).toLocaleDateString());
  if (existingEvent && existingEvent.summary === event.summary && getEventStart(existingEvent) === getEventStart(event)) {
    console.log('Skipping because event already exists');
    console.log(new Date(existingEvent.start.dateTime).toLocaleDateString(), existingEvent.summary);
  } else if (existingEvent) {
    console.log('*** UPDATING EVENT ***');
    console.log('FROM:');
    console.log(new Date(existingEvent.start.dateTime).toLocaleDateString(), existingEvent.summary);
    await calendarApi.events.update({
      calendarId,
      eventId: existingEvent.id,
      resource: event,
    });
    console.log('TO:');
  } else {
    const response = await calendarApi.events.insert({
      calendarId,
      resource: event,
    });
    console.log('*** NEW EVENT CREATED ***');
    console.log(response.data.htmlLink);
  }
  console.log(new Date(event.start.dateTime).toLocaleDateString(), event.summary);
  console.log('');
}

function getEventStart(event) {
  return new Date(event.start.dateTime).toLocaleString();
}