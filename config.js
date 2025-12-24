import { scrapeText } from './scrape-text.js';
import { scrapePortland } from './scrape-portland.js';
import { scrapePortlandECD } from './scrape-portland-ecd.js';
import { scrapeCorvallis } from './scrape-corvallis.js';

export const MONTHS_TO_SCRAPE = 6;

export const LOCATIONS = [
  {
    "short_name": "lake_city",
    "name": "Lake City",
    "shortName": "SEA",
    "url": "https://seattledance.org/contra/lakecity/",
    "address": "Seattle Latvian Center, 11710 3rd Ave NE, Seattle, WA 98125",
    "calendarId": "c_209dd20b8bb61cfd0f6d802f39dba35dca0e6ffc6ce277ebe252df3e10eb9c91@group.calendar.google.com",
    "startTime": "19:30",
    "endTime": "22:00",
    "startText": "Schedule of UPCOMING musicians and callers:",
    "endText": "For information about",
    "regex": /^(\w+\s+\d+(?:,\s+\d{4})?)\s*[-–]\s*(.*)$/,
    "scrapeFunction": scrapeText
  },
  {
    "short_name": "phinney",
    "name": "Phinney",
    "shortName": "SEA",
    "url": "https://seattledance.org/contra/emeraldcity/",
    "address": "Phinney Neighborhood Center, 6532 Phinney Ave N, Seattle, WA 98103",
    "calendarId": "c_42ee47ff4843196fa83996037bf6965f412b091e08d7823c39d75a1e0d8b6eda@group.calendar.google.com",
    "startTime": "19:30",
    "endTime": "22:00",
    "startText": "for dance roles.",
    "endText": "EOF",
    "regex": /^(\w+\s+\d+)\s*(.*?)(?=\n\w+\s+\d+|\n*$)/,
    "scrapeFunction": scrapeText
  },
  {
    "short_name": "olympia",
    "name": "Olympia",
    "shortName": "OLY",
    "url": "https://oly-wa.us/southbaygrange/contra.php",
    "address": "South Bay Grange, 3918 Sleater Kinney Rd NE, Olympia, WA 98506",
    "calendarId":"c_0e9cd114fc26b5269e121f29d03ac2ea1e553c31f6522acaa850d813e433b05b@group.calendar.google.com",
    "startTime": "19:30",
    "endTime": "22:00",
    "startText": "Upcoming Dances",
    "endText": "Past Dances",
    "regex": /(\S+\s+\d+(?:st|nd|rd|th)?,\s+\d{4}):(.*)/,
    "scrapeFunction": scrapeText
  },
  {
    "short_name": "corvallis",
    "name": "Corvallis",
    "shortName": "COR",
    "url": "http://corvallisfolklore.org/home/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&ai1ec_cat_ids=8&xml=true",
    "calendarId": "c_d97061699c63fc077cb7c3588fc89e7362363112a9017cb7be0192f6236170e9@group.calendar.google.com",
    "scrapeFunction": scrapeCorvallis
  },
  {
    "short_name": "portland",
    "name": "Portland",
    "shortName": "PDX",
    "calendarId": "c_0ea1d2488b046c7557c69739657bdef549f31c1d156e64275a28f7eccf82b434@group.calendar.google.com",
    "scrapeFunction": scrapePortland
  },
  {
    "short_name": "ecd",
    "name": "Portland ECD",
    "shortName": "ECD",
    "calendarId": "c_ada0949aec738e310e18d339ff565b07714cecce89336ff4ecc7438c5ee97d84@group.calendar.google.com",
    "scrapeFunction": scrapePortlandECD
  }
]
