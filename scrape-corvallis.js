import axios from 'axios';
import xml2js from 'xml2js';
import { isBefore, isAfter, subDays, addMonths } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

export async function scrapeCorvallis({ url }) {
  const response = await axios.get(url);
  const { icalendar: { vcalendar: { components: { vevent } } } } = 
    await xml2js.parseStringPromise(response.data, {explicitArray: false, ignoreAttrs: true, tagNameProcessors: [xml2js.processors.stripPrefix]});
  const futureEvents = vevent.map(({ properties }) => properties).filter(({ dtstart }) => {
    const date = new Date(dtstart['date-time']);
    return isAfter(date, subDays(today, 2)) && isBefore(date, addMonths(today, MONTHS_TO_SCRAPE));
  });
  return futureEvents.map(({ summary, dtstart, dtend, location, description, url }) => ({
    summary: summary.text.replace('Contra Dance – ', ''),
    startDateTime: zonedTimeToUtc(new Date(dtstart['date-time']), 'America/Los_Angeles').toISOString(),
    endDateTime: zonedTimeToUtc(new Date(dtend['date-time']), 'America/Los_Angeles').toISOString(),
    location: location.text,
    description: description.text,
    url: url.uri
  }));
}
