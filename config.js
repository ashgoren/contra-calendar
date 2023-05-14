export default {
  "lake_city": {
    "name": "Lake City",
    "url": "https://seattledance.org/contra/lakecity/",
    "address": "Seattle Latvian Center, 11710 3rd Ave NE, Seattle, WA 98125",
    "calendar_id": "c_209dd20b8bb61cfd0f6d802f39dba35dca0e6ffc6ce277ebe252df3e10eb9c91@group.calendar.google.com",
    "start_time": "19:30",
    "end_time": "22:00",
    "start_text": "Contra Dances:",
    "end_text": "For information about",
    "regex": /^(\w+\s+\d+)\s*[-–]\s*(.*)$/gm
  },
  "phinney": {
    "name": "Phinney",
    "url": "https://seattledance.org/contra/emeraldcity/",
    "address": "Phinney Neighborhood Center, 6532 Phinney Ave N, Seattle, WA 98103",
    "calendar_id": "c_42ee47ff4843196fa83996037bf6965f412b091e08d7823c39d75a1e0d8b6eda@group.calendar.google.com",
    "start_time": "19:30",
    "end_time": "22:00",
    "start_text": "for dance roles.",
    "end_text": "COVID cases from previous dances",
    "regex": /^(\w+\s+\d+)\s*[-–]\s*(.*)$/gm
  },
  "olympia": {
    "name": "Olympia",
    "url": "https://oly-wa.us/southbaygrange/contra.php",
    "address": "South Bay Grange, 3918 Sleater Kinney Rd NE, Olympia, WA 98506",
    "calendar_id":"c_0e9cd114fc26b5269e121f29d03ac2ea1e553c31f6522acaa850d813e433b05b@group.calendar.google.com",
    "start_time": "19:30",
    "end_time": "22:00",
    "start_text": "Upcoming Dances",
    "end_text": "Covid protocols",
    "regex": /(\w+\s+\d+(?:st|nd|rd|th),\s+\d{4}):(.*)/g
  },
  "portland": {
    "name": "Portland",
    "calendar_id": "c_0ea1d2488b046c7557c69739657bdef549f31c1d156e64275a28f7eccf82b434@group.calendar.google.com"
  }
}
