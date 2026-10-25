// Checks the data files you edit, and expands them into the full versions the pages read.
//
// You edit short, simple files in src/assets/. The build (scripts/build.mjs) runs them through
// this file, which:
//   1. checks them — wrong dates, unknown pools, typos in Home/Away… — and
//   2. writes the expanded versions into dist/, where the pages read them.
//
// If anything is wrong, the build stops with a plain-English list of problems and leaves the
// last good dist/ alone, so a typo never reaches the live site.
//
//   src/assets/data/practice-schedule.json   rules: first/last day, usual days, time, place, changes
//        → dist/…/practice-schedule.json      every practice day, grouped by week
//   src/assets/meets/meets-YYYY-YYYY.json     short meets: pool and school codes, "6:00 PM"
//        → dist/…/meets-YYYY-YYYY.json        full names, 24-hour times, regular/post season
//   src/assets/meets/schools.json, pools.json the code → full name lists used above
//   src/assets/data/importantDates.json       checked, copied as is

import fs from "node:fs";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOME_AWAY = ["Home", "Away", "Neutral"];

// ---------- Small helpers ----------

// Collects problems instead of stopping at the first one, so you see everything at once.
export class Problems {
  list = [];
  add(file, where, message) {
    this.list.push(`${file}${where ? `, ${where}` : ""}: ${message}`);
  }
}

// Reads a JSON file. A syntax mistake (missing comma, extra comma, unquoted text) becomes a problem
// with the line number, instead of a crash.
export function readJson(path, problems) {
  const text = fs.readFileSync(path, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    const position = Number(error.message.match(/position (\d+)/)?.[1]);
    const line = Number.isFinite(position) ? text.slice(0, position).split("\n").length : null;
    problems.add(path, line ? `line ${line}` : "", `isn't valid JSON (${error.message.replace(/ in JSON at.*$/, "")}). Look for a missing or extra comma or quote.`);
    return null;
  }
}

// "2026-11-09" → a Date, or null if it isn't a real date in that format.
function parseDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [y, m, d] = text.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}
const isoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

function checkDate(value, problems, file, where, field = "date") {
  if (parseDate(value)) return true;
  problems.add(file, where, `"${field}" should be a real date written like "2026-11-09" (got ${JSON.stringify(value)}).`);
  return false;
}

// "6:00 PM" → "18:00" (the meets pages want 24-hour times), or null.
function to24Hour(text) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(text).trim());
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

// "3:30-4:30 PM" or "3:30 PM - 5:00 PM"
const PRACTICE_TIME = /^\d{1,2}:\d{2}(\s*(AM|PM))?\s*[-–]\s*\d{1,2}:\d{2}\s*(AM|PM)$/i;

// "Mon" or "monday" → "Monday"
function dayName(text) {
  const typed = String(text).toLowerCase();
  if (typed.length < 3) return null; // "T" could be Tuesday or Thursday
  return DAYS.find((day) => day.toLowerCase().startsWith(typed)) ?? null;
}

// ---------- Meets ----------

// Checks one season's meets and returns the expanded version (or null if it can't).
export function expandMeets(source, { schools, pools }, problems, file) {
  if (!source || !Array.isArray(source.meets)) {
    problems.add(file, "", `needs a "meets" list.`);
    return null;
  }
  const meets = [];
  source.meets.forEach((meet, index) => {
    const where = `meet ${index + 1}${meet.date ? ` (${meet.date})` : ""}`;
    const ok = checkDate(meet.date, problems, file, where);
    const championship = String(meet.type ?? "").includes("Championship");

    if (!meet.type) problems.add(file, where, `needs a "type", like "Double Dual" or "District Championship".`);
    const startTime = to24Hour(meet.time);
    if (!startTime) problems.add(file, where, `"time" should look like "6:00 PM" (got ${JSON.stringify(meet.time)}).`);
    if (!HOME_AWAY.includes(meet.homeAway)) problems.add(file, where, `"homeAway" must be Home, Away, or Neutral (got ${JSON.stringify(meet.homeAway)}).`);
    if (!pools[meet.pool]) problems.add(file, where, `pool "${meet.pool}" isn't in pools.json. Use one of: ${Object.keys(pools).join(", ")} — or add it to pools.json.`);

    const opponents = Array.isArray(meet.opponents) ? meet.opponents : [];
    if (!opponents.length) problems.add(file, where, `needs at least one opponent in "opponents".`);
    for (const code of opponents) {
      // Championships list the meet's field (e.g. "Northwestern District"), which isn't a school.
      if (!championship && !schools[code]) problems.add(file, where, `opponent "${code}" isn't in schools.json. Add it there with the school's full name.`);
    }

    if (meet.status && !["canceled", "postponed"].includes(meet.status)) problems.add(file, where, `"status" can be "canceled" or "postponed" (or left out).`);

    // Results: every score has to be against one of this meet's opponents.
    for (const team of ["boys", "girls"]) {
      for (const score of meet.results?.[team]?.scores ?? []) {
        if (!opponents.includes(score.vs)) problems.add(file, `${where} results`, `${team} score "vs": "${score.vs}" isn't one of this meet's opponents (${opponents.join(", ")}).`);
        if (typeof score.us !== "number" || typeof score.them !== "number") problems.add(file, `${where} results`, `${team} score vs ${score.vs} needs numbers for "us" and "them".`);
      }
    }

    if (!ok) return;
    meets.push({
      date: meet.date,
      type: meet.type,
      ...(meet.status ? { status: meet.status } : {}),
      ...(meet.statusNote ? { statusNote: meet.statusNote } : {}),
      opponents: opponents.map((code) => ({ short: code, full: schools[code] ?? code })),
      homeAway: meet.homeAway,
      hostSchool: meet.host || (meet.homeAway === "Home" ? "Kettle Run" : ""),
      location: meet.pool,
      locationFull: pools[meet.pool] ?? meet.pool,
      startTime: startTime ?? "00:00",
      seasonDesignation: championship ? "Post Season" : "Regular Season",
      ...(meet.results ? { results: meet.results } : {}),
    });
  });
  meets.sort((a, b) => a.date.localeCompare(b.date));
  if (source.updated !== undefined) checkDate(source.updated, problems, file, "", "updated");
  return { season: source.season, updated: source.updated, meets };
}

// ---------- Practices ----------

// Turns the practice rules into every practice day, grouped Monday–Sunday.
//   - every "days" weekday from "first" through "last" is a practice
//   - "changes" can turn a day (or a range with "through") off, or change its time or place
//   - a meet on a practice day turns that practice off automatically ("Meet day")
export function expandPractices(source, meetDates, problems, file) {
  if (!source) return null;
  const first = parseDate(source.first);
  const last = parseDate(source.last);
  if (!first) problems.add(file, "", `"first" should be the first practice date, like "2026-11-09".`);
  if (!last) problems.add(file, "", `"last" should be the last practice date, like "2027-02-18".`);
  if (first && last && last < first) problems.add(file, "", `"last" (${source.last}) is before "first" (${source.first}).`);

  const days = (source.days ?? []).map((day) => {
    const name = dayName(day);
    if (!name) problems.add(file, "days", `"${day}" isn't a day of the week.`);
    return name;
  });
  if (!days.length) problems.add(file, "", `"days" should list the usual practice days, like ["Monday", "Tuesday", "Wednesday", "Thursday"].`);
  if (!PRACTICE_TIME.test(source.time ?? "")) problems.add(file, "", `"time" should look like "3:30-4:30 PM" (got ${JSON.stringify(source.time)}).`);
  if (!source.location) problems.add(file, "", `needs a "location", like "WARF".`);
  if (source.updated !== undefined) checkDate(source.updated, problems, file, "", "updated");

  // Each change applies to one date, or a range "date" through "through".
  const changes = new Map(); // "2026-11-26" → { off, time, location, note }
  (source.changes ?? []).forEach((change, index) => {
    const where = `change ${index + 1}`;
    if (!checkDate(change.date, problems, file, where)) return;
    if (change.through !== undefined && !checkDate(change.through, problems, file, where, "through")) return;
    if (change.time !== undefined && !PRACTICE_TIME.test(change.time)) problems.add(file, where, `"time" should look like "5:00-6:00 PM".`);
    if (!change.off && !change.time && !change.location) problems.add(file, where, `should say "off": true, or give a different "time" or "location".`);
    const start = parseDate(change.date);
    const end = parseDate(change.through ?? change.date);
    if (end < start) problems.add(file, where, `"through" is before "date".`);
    for (let day = start; day <= end; day = addDays(day, 1)) changes.set(isoDate(day), change);
  });

  if (!first || !last || last < first || !days.length) return null;

  // Walk week by week, Monday to Sunday.
  const weeks = [];
  const monday = addDays(first, -((first.getUTCDay() + 6) % 7));
  for (let weekStart = monday; weekStart <= last; weekStart = addDays(weekStart, 7)) {
    const practices = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const name = DAYS[day.getUTCDay()];
      if (day < first || day > last || !days.includes(name)) continue;
      const date = isoDate(day);
      const change = changes.get(date) ?? {};
      const meetDay = meetDates.has(date);
      practices.push({
        day: { short: name.slice(0, 3), long: name },
        date,
        time: change.time ?? source.time,
        location: change.location ?? source.location,
        status: change.off || meetDay ? "off" : "normal",
        note: change.note ?? (meetDay ? "Meet day" : ""),
      });
    }
    weeks.push({ weekStart: isoDate(weekStart), weekEnd: isoDate(addDays(weekStart, 6)), practices });
  }
  return { season: source.season, updated: source.updated, weeks };
}

// ---------- Important dates ----------

export function checkImportantDates(source, problems, file) {
  if (!source || !Array.isArray(source.items)) {
    problems.add(file, "", `needs an "items" list.`);
    return;
  }
  source.items.forEach((item, index) => {
    const where = `item ${index + 1}${item.name ? ` (${item.name})` : ""}`;
    checkDate(item.date, problems, file, where);
    if (!item.name) problems.add(file, where, `needs a "name".`);
  });
}
