import axios from 'axios';
import { extractTextBetween } from './utils.js';
import { parse, isBefore, isAfter, subDays, addMonths, addYears } from 'date-fns';
import { MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

// Scrape sites that are basically plain text (Lake City, Phinney, Olympia)
export async function scrapeText({ url, startText, endText, regex, startTime, endTime}) {
  const { data } = await axios.get(url);
  const content = extractTextBetween({ data, startText, endText });

  let scrapedEvents = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [_, date, summary] = match;
    const { startDateTime, endDateTime } = setDateTime({ date, startTime, endTime });
    const eventDate = new Date(startDateTime);
    if (isAfter(eventDate, subDays(today, 2)) && isBefore(eventDate, addMonths(today, MONTHS_TO_SCRAPE))) {
      scrapedEvents.push({
        startDateTime,
        endDateTime,
        summary: summary.trim()
      });
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
  startDate.setHours(...startTime.split(':'));
  const startDateTime = startDate.toISOString(); 
       
  let endDate = new Date(eventDate);
  endDate.setHours(...endTime.split(':'));
  const endDateTime = endDate.toISOString();

  return { startDateTime, endDateTime };
}
