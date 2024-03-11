import axios from 'axios';
import { parse, isBefore, isAfter, subDays, addMonths, addYears } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { extractTextBetween } from './utils.js';
import { MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

// Scrape sites that are basically plain text (Lake City, Phinney, Olympia)
export async function scrapeText({ url, startText, endText, regex, startTime, endTime}) {
  const { data } = await axios.get(url);
  const content = extractTextBetween({ data, startText, endText });
  const lines = content.split(/\n+/);
  let scrapedEvents = [];
  for (const line of lines) {
    // console.log(line);
    const match = regex.exec(line);
    if (match) {
      const [_, date, summary] = match;
      const { startDateTime, endDateTime } = setDateTime({ date, startTime, endTime });
      const eventDate = new Date(startDateTime);
      // console.log('eventDate', eventDate);
      // console.log('summary', summary);
      if (isAfter(eventDate, subDays(today, 2)) && isBefore(eventDate, addMonths(today, MONTHS_TO_SCRAPE))) {
        scrapedEvents.push({
          startDateTime,
          endDateTime,
          summary: summary.trim()
        });
      }
    }
  }
  return scrapedEvents;
}

function setDateTime({ date, startTime, endTime }) {
  let eventDate;
  date = date.replace(/\bSept\b/g, 'Sep');
  if (date.includes(',')) {
    eventDate = parse(date, 'MMMM do, yyyy', today);
  } else {
    eventDate = parse(date, 'MMMM dd', today);
    if (isBefore(eventDate, subDays(today, 1))) {
      eventDate = addYears(eventDate, 1);
    }
  }

  let startDate = new Date(eventDate);
  startDate.setHours(...startTime.split(':'));
  const startDateTime = zonedTimeToUtc(startDate, 'America/Los_Angeles').toISOString();
       
  let endDate = new Date(eventDate);
  endDate.setHours(...endTime.split(':'));
  const endDateTime = zonedTimeToUtc(endDate, 'America/Los_Angeles').toISOString();

  return { startDateTime, endDateTime };
}
