// src/automation/scheduleParser.js
//
// Deliberately narrow: recognizes a specific set of phrasings rather than
// attempting general date/time NLP. Anything it doesn't recognize returns
// null so the caller can ask the owner to rephrase — silently guessing a
// wrong time for a scheduled message is worse than asking again.
//
// Supported:
//   "tomorrow at 9am" / "tomorrow at 9:30 pm" / "today at 5pm"
//   "in 10 minutes" / "in 2 hours"
//   "every monday at 8am" / "every day at 7"
//
// Returns one of:
//   { type: "once", runAt: <Date> }
//   { type: "weekly", dayOfWeek: 0-6, hour, minute }
//   { type: "daily", hour, minute }
//   null

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTimeOfDay(str) {
  // "9am", "9:30pm", "17:00", "9 am"
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (hour > 23 || minute > 59) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return { hour, minute };
}

function nextOccurrence(baseDate, hour, minute) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseSchedule(text, now = new Date()) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return null;

  // "in N minutes/hours"
  let m = t.match(/\bin\s+(\d+)\s*(minute|min|hour|hr)s?\b/);
  if (m) {
    const amount = parseInt(m[1], 10);
    const unitMs = /hour|hr/.test(m[2]) ? 3600_000 : 60_000;
    return { type: "once", runAt: new Date(now.getTime() + amount * unitMs) };
  }

  // "every <weekday> at <time>"
  m = t.match(/\bevery\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+at\s+(.+)$/);
  if (m) {
    const dayOfWeek = WEEKDAYS.indexOf(m[1]);
    const time = parseTimeOfDay(m[2]);
    if (!time) return null;
    return { type: "weekly", dayOfWeek, hour: time.hour, minute: time.minute };
  }

  // "every day at <time>"
  m = t.match(/\bevery\s+day\s+at\s+(.+)$/);
  if (m) {
    const time = parseTimeOfDay(m[1]);
    if (!time) return null;
    return { type: "daily", hour: time.hour, minute: time.minute };
  }

  // "tomorrow at <time>"
  m = t.match(/\btomorrow\s+at\s+(.+)$/);
  if (m) {
    const time = parseTimeOfDay(m[1]);
    if (!time) return null;
    const base = new Date(now);
    base.setDate(base.getDate() + 1);
    return { type: "once", runAt: nextOccurrence(base, time.hour, time.minute) };
  }

  // "today at <time>"
  m = t.match(/\btoday\s+at\s+(.+)$/);
  if (m) {
    const time = parseTimeOfDay(m[1]);
    if (!time) return null;
    let runAt = nextOccurrence(now, time.hour, time.minute);
    if (runAt <= now) runAt = new Date(runAt.getTime() + 24 * 3600_000); // already passed today -> tomorrow
    return { type: "once", runAt };
  }

  return null;
}

function cleanGroupQuery(q) {
  return q.replace(/\bgroup\b/gi, "").replace(/\s+/g, " ").trim();
}

/**
 * Splits an owner request like "remind Zuno tomorrow at 9am saying the
 * meeting starts at 10" into { groupQuery, message, schedule }.
 * Returns null if it can't confidently find both a schedule and a message.
 */
function parseReminderRequest(text, now = new Date()) {
  const t = String(text || "").trim();

  // "remind <group> <when> saying/that <message>"
  let m = t.match(/\bremind\s+(?:the\s+)?(.+?)\s+(tomorrow.+?|today.+?|every\s+\w+.+?|in\s+\d+.+?)\s+(?:saying|that)\s+(.+)/i);
  if (m) {
    const schedule = parseSchedule(m[2], now);
    if (!schedule) return null;
    return { groupQuery: cleanGroupQuery(m[1]), message: m[3].trim(), schedule };
  }

  // "send <message> to <group> every ..." / "send good morning to the team every monday at 8"
  m = t.match(/\bsend\s+(.+?)\s+to\s+(?:the\s+)?(.+?)\s+(every\s+\w+.+|tomorrow.+|today.+|in\s+\d+.+)/i);
  if (m) {
    const schedule = parseSchedule(m[3], now);
    if (!schedule) return null;
    return { groupQuery: cleanGroupQuery(m[2]), message: m[1].trim(), schedule };
  }

  return null;
}

module.exports = { parseSchedule, parseReminderRequest, WEEKDAYS };
