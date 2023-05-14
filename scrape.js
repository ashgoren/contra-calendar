import axios from 'axios';
import { JSDOM } from 'jsdom';
import xml2js from 'xml2js';
import { parse, isBefore, isAfter, subDays, addMonths, addYears } from 'date-fns';
import { setupGoogleCalendarApi } from './google-auth.js';
import { addEventsToGoogleCalendar } from './google-calendar.js';
import { extractTextBetween, confirmAction, logEvents } from './utils.js';
import { LOCATIONS, MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

try {
  const calendarApi = await setupGoogleCalendarApi();
  for (const config of Object.values(LOCATIONS)) {
    await handleLocation({ calendarApi, config });
  }
} catch (err) {
  console.error(err);
}

async function handleLocation({ calendarApi, config }) {
  // scrape events
  console.log(`\n\nScraping ${config.name}...`)
  let scrapedEvents;
  switch (config.name) {
    case 'Portland':
      scrapedEvents = await scrapePortland();
      break;
    case 'Corvallis':
      scrapedEvents = await scrapeCorvallis(config);
      break;
    default:
      scrapedEvents = await scrape(config);
  }

  // build google-compatible events
  const builtEvents = await buildEvents({ events: scrapedEvents, config });
  
  // confirm and add events to google calendar
  logEvents({ events: builtEvents, name: config.name });
  if (await confirmAction(`Do the above scraped events look correct for ${config.name}?`)) {
    await addEventsToGoogleCalendar({
      builtEvents,
      calendarApi,
      calendarId: config.calendar_id
    });
  } else {
    console.log(`Skipped ${config.name}`);
  }
}


// ********************************************************
// ********** Scrape Lake City, Phinney, Olympia **********
// ********************************************************
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
    const { startDateTime, endDateTime } = setDateTime({
      date,
      startTime: config.start_time,
      endTime: config.end_time
    });
    const eventDate = new Date(startDateTime);
    if (isAfter(eventDate, subDays(today, 2)) && isBefore(eventDate, addMonths(today, MONTHS_TO_SCRAPE))) {
      scrapedEvents.push({ startDateTime, endDateTime, summary });
    }
  }
  return scrapedEvents;
}

function setDateTime({ date, startTime, endTime }) {
  let eventDate;
  if (date.includes(',')) {
    eventDate = parse(date, 'MMMM do, yyyy', today);
  } else {
    eventDate = parse(date, 'MMMM dd', today);
    if (isBefore(eventDate, subDays(today, 1))) {
      eventDate = addYears(eventDate, 1);
    }
  }

  let startDate = new Date(eventDate);
  startDate.setHours(startTime.split(':')[0]);
  startDate.setMinutes(startTime.split(':')[1]);
  const startDateTime = startDate.toISOString(); 
       
  let endDate = new Date(eventDate);
  endDate.setHours(endTime.split(':')[0]);
  endDate.setMinutes(endTime.split(':')[1]);
  const endDateTime = endDate.toISOString();

  return { startDateTime, endDateTime };
}


// *************************************
// ********** Scrape Portland **********
// *************************************
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
      startDateTime: event.startDate,
      endDateTime: event.endDate,
      location: event.location.name,
      description: event.description,
      url: event.url
    }
  });
  return mappedEvents;
}


// **************************************
// ********** Scrape Corvallis **********
// **************************************
async function scrapeCorvallis(config) {
  const response = await axios.get(config.url);
  const result = await xml2js.parseStringPromise(response.data, {explicitArray: false, ignoreAttrs: true, tagNameProcessors: [xml2js.processors.stripPrefix]});
  const events = result.icalendar.vcalendar.components.vevent.map(event => event.properties);
  const futureEvents = events.filter((event) => {
    const date = new Date(event.dtstart['date-time']);
    return isAfter(date, subDays(today, 2)) && isBefore(date, addMonths(today, MONTHS_TO_SCRAPE));
  });
  const mappedEvents = futureEvents.map((event) => {
    return {
      summary: event.summary.text,
      startDateTime: new Date(event.dtstart['date-time']).toISOString(),
      endDateTime: new Date(event.dtend['date-time']).toISOString(),
      location: event.location.text,
      description: event.description.text,
      url: event.url.uri
    }
  });
  return mappedEvents;
}


// **************************************************
// ********** Build Google Calendar Events **********
// **************************************************
async function buildEvents({ events, config }) {
  let builtEvents = [];
  for (const { summary, startDateTime, endDateTime, location, description, url } of events) {
    const summaryWithName = `[${config.short_name}] ${summary}`;

    let event = {
      'summary': summaryWithName,
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
    };
    builtEvents.push(event);
  }
  return builtEvents;
}
