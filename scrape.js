import axios from 'axios';
import { parse, isBefore, isAfter, subDays, addMonths, addYears } from 'date-fns';
import { JSDOM } from 'jsdom';
import { google } from 'googleapis';
import { authorize } from './google.js';
import { confirmAction, logEvents } from './utils.js';
import globalConfig from './config.js';
const today = new Date();

const MONTHS_TO_SCRAPE = 6;

try {
  const auth = await authorize();
  const calendar = google.calendar({version: 'v3', auth});
  
  for (const config of Object.values(globalConfig)) {
    const scrapedEvents = config.name === 'Portland' ? await scrapePortland() : await scrape(config);
    const builtEvents = await buildEvents({ events: scrapedEvents, config });
    logEvents({ events: builtEvents, name: config.name });
    if (await confirmAction(`Do the above scraped events look correct for ${config.name}?`)) {
      const existingEvents = await fetchExistingEvents({ calendar, config });
      if (existingEvents.length > 0) {
        for (const event of builtEvents) {
          await new Promise(done => setTimeout(() => done(), 1000));
          addEvent({ calendar, existingEvents, event, config });
        }
      } else {
        throw new Error('No existing events found. Is this the right calendar?');
      }
    }
  }
} catch (err) {
  console.error(err);
}

async function scrape(config) {
  const response = await axios.get(config.url);
  const content = extractTextBetween({
    html: response.data,
    startText: config.start_text,
    endText: config.end_text
  });

  let scrapedEvents = [];
  let match;
  while ((match = config.regex.exec(content)) !== null) {
    const date = match[1];
    const summary = match[2].trim();
    const fullDate = normalizeDate(date);
    if (fullDate) scrapedEvents.push({ date: fullDate, summary });
  }
  return scrapedEvents;
}

async function scrapePortland() {
  let events = [];
  for (let i = 0; i < MONTHS_TO_SCRAPE; i++) {
    const month = addMonths(today, i).getMonth() + 1;
    const year = addMonths(today, i).getFullYear();
    const url = `https://portlandcountrydance.org/calendar/?format=calendar&mcat=2&time=month&month=${month}&yr=${year}`;
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const scriptTags = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const scriptTagWithoutClass = scriptTags.find(script => !script.className);
    if (scriptTagWithoutClass) {
      const jsonString = scriptTagWithoutClass.textContent;
      const data = JSON.parse(jsonString);
      events.push(...data);
    }
  }
  const uniqueEvents = events.filter((event, index) => {
    const firstIndex = events.findIndex(e => e.name === event.name && e.startDate === event.startDate);
    return firstIndex === index;
  });
  const futureEvents = uniqueEvents.filter((event) => {
    const date = new Date(event.startDate);
    return isAfter(date, subDays(today, 2)) && isBefore(date, addMonths(today, MONTHS_TO_SCRAPE));
  });
  const mappedEvents = futureEvents.map((event) => {
    return {
      summary: event.name,
      date: event.startDate,
      endDate: event.endDate,
      location: event.location.name,
      description: event.description,
      url: event.url
    }
  });
  return mappedEvents;
}

async function buildEvents({ events, config }) {
  let builtEvents = [];
  for (const { summary, date, endDate, location, description, url } of events) {
    let startDateTime = date;
    let endDateTime = endDate;      
    if (config.name !== 'Portland') {
      date.setHours(config.start_time.split(':')[0]);
      date.setMinutes(config.start_time.split(':')[1]);
      startDateTime = date.toISOString();      
      let endDate = new Date(date);
      endDate.setHours(config.end_time.split(':')[0]);
      endDate.setMinutes(config.end_time.split(':')[1]);
      endDateTime = endDate.toISOString();
    }

    let event = {
      'summary': summary,
      'location': location || config.address,
      'description': config.name === 'Portland' ? `${description}\n\n${url}` : config.url,
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
    };
    builtEvents.push(event);
  }
  return builtEvents;
}

async function addEvent({ calendar, existingEvents, event, config }) {
  const existingEvent = existingEvents.find(e => new Date(e.start.dateTime).getUTCDate() === new Date(event.start.dateTime).getUTCDate());
  if (existingEvent && existingEvent.summary === event.summary) {
    console.log('Skipping because event already exists', event);
    return;
  } else if (existingEvent) {
    await calendar.events.update({
      calendarId: config.calendar_id,
      eventId: existingEvent.id,
      resource: event,
    });
    console.log(`Event updated: ${existingEvent.htmlLink}`);
  } else {
    const response = await calendar.events.insert({
      calendarId: config.calendar_id,
      resource: event,
    });
    console.log(`Event created: ${response.data.htmlLink}`);
  }
}

async function fetchExistingEvents({ calendar, config }) {
  const response = await calendar.events.list({
    calendarId: config.calendar_id,
    timeMin: subDays(today, 1).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

function extractTextBetween({ html, startText, endText }) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const bodyText = document.body.textContent;

  const startIndex = bodyText.indexOf(startText) + startText.length;
  const endIndex = bodyText.indexOf(endText);

  if (startIndex >= startText.length && endIndex > startIndex) {
    return bodyText.slice(startIndex, endIndex).trim();
  } else {
    console.error('Could not find the specified start and end text.');
  }
};

function normalizeDate(date) {
  let eventDate;
  if (date.includes(',')) {
    eventDate = parse(date, 'MMMM do, yyyy', today);
  } else {
    eventDate = parse(date, 'MMMM dd', today);
    if (isBefore(eventDate, subDays(today, 1))) {
      eventDate = addYears(eventDate, 1);
    }
  }
  if (eventDate > subDays(today, 2) && eventDate < addMonths(today, MONTHS_TO_SCRAPE)) {
    return eventDate;
  }
}
