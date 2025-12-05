import axios from 'axios';
import { parse, isBefore, isAfter, subDays, addMonths, addYears } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { extractTextBetween } from './utils.js';
import { MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

const parseScrapedText = ({ data, startText, endText, regex, startTime, endTime }) => {
  const content = extractTextBetween({ data, startText, endText });
  const lines = content.split(/\n+/);
  let scrapedEvents = [];
  for (const line of lines) {
    // console.log(line);
    const match = regex.exec(line);
    if (match) {
      // console.log('Matched:', match);
      const [_, date, summary] = match;
      // console.log (`Date: ${date}\nSummary: ${summary}\n`);
      const { startDateTime, endDateTime } = setDateTime({ date, startTime, endTime });
      const eventDate = new Date(startDateTime);
      // console.log('\neventDate', eventDate);
      // console.log('summary', summary);
      if (isAfter(eventDate, subDays(today, 2)) && isBefore(eventDate, addMonths(today, MONTHS_TO_SCRAPE))) {
        // console.log(`Adding event on ${date}: ${summary.trim()}`);
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

// Scrape sites that are basically plain text (Lake City, Phinney, Olympia)
export async function scrapeText({ url, startText, endText, regex, startTime, endTime}) {
  let scrapedEvents = [];
  try {
    const { data } = await axios.get(url, {
      headers: {
        accept: 'text/html',
        'user-agent': 'mozilla/5.0 (compatible; Contra/1.0)'
      }
    });
    const content = extractTextBetween({ data, startText, endText });
    const lines = content.split(/\n+/);
    scrapedEvents = parseScrapedText({ data, startText, endText, regex, startTime, endTime });
    return scrapedEvents;
  } catch (error) {
    if (error.response?.data) {
      console.log('Error but server still returned data, attempting to parse it.\n');
      const data = error.response.data;
      scrapedEvents = parseScrapedText({ data, startText, endText, regex, startTime, endTime });
      return scrapedEvents;
    } else {
      console.error(`Error scraping ${url}:`, error);
    }
    return [];
  }
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
