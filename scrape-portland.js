import axios from 'axios';
import { JSDOM } from 'jsdom';
import { isBefore, isAfter, subDays, addMonths } from 'date-fns';
import { MONTHS_TO_SCRAPE } from './config.js';
const today = new Date();

export async function scrapePortland({}) {
  let events = [];
  for (let i = 0; i < MONTHS_TO_SCRAPE; i++) {
    const month = addMonths(today, i).getMonth() + 1;
    const year = addMonths(today, i).getFullYear();
    const url = `https://portlandcountrydance.org/calendar/?format=calendar&mcat=2&time=month&month=${month}&yr=${year}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    const { window: { document } } = new JSDOM(data);
    const scriptTags = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const scriptTagWithoutClass = scriptTags.find(({ className }) => !className);
    if (scriptTagWithoutClass) {
      const { textContent } = scriptTagWithoutClass;
      events.push(...JSON.parse(textContent));
    }
  }
  const uniqueEvents = events.filter((event, index) => {
    const firstIndex = events.findIndex(({ name, startDate }) => name === event.name && startDate === event.startDate);
    return firstIndex === index;
  });
  const futureEvents = uniqueEvents.filter(({ startDate }) => {
    const date = new Date(startDate);
    return isAfter(date, subDays(today, 2)) && isBefore(date, addMonths(today, MONTHS_TO_SCRAPE));
  });
  return futureEvents.map(({ name, startDate, endDate, location, description, url }) => ({
    summary: name
      .replace('PCDC 2nd Saturday Contra:','PCDC')
      .replace('PCDC 4th Saturday Contra:','PCDC')
      .replace('PCDC 5th Saturday','PCDC')
      .replace('1st Saturday Contra: ','')
      .replace('First Saturday Contra: ','')
      .replace('3rd Saturday Contra: ','')
      .replace('Third Saturday Contra: ',''),
    startDateTime: startDate,
    endDateTime: endDate,
    location: location.name,
    description,
    url
  }));
}
