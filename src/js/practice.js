// Fills in the Practice Schedule page from assets/data/practice-schedule.json.
//
// The practice JSON: { season, updated, weeks: [{ weekStart, weekEnd, practices: [...] }] }.
// Each practice: { day: { short, long }, date, time, location, status: "normal" | "off", note }.
//
// The page has two parts:
//   1. Regular schedule   #usual-days, #usual-time, #usual-location
//   2. Week by week       #weeks-head (column headers) and #weeks-body
//        desktop: Week # · one column per practice day (Mon, Tue, …)
//        phones:  the same table, tighter, without the labels under each date
// Plus the hero band: #practice-season and #practice-updated.

// Today's date as "YYYY-MM-DD". For checking the in-season look during the offseason,
// add ?date=2026-01-14 to the page address to pretend it's that day.
function todayISO() {
  const override = new URLSearchParams(location.search).get("date");
  if (/^\d{4}-\d{2}-\d{2}$/.test(override ?? "")) return override;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Creates an element with classes and text. Using textContent (not innerHTML)
// means data can never be mistaken for HTML.
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

const toDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// "2026-02-23" → "Feb 23, 2026" (or "Feb 23" with { year: false })
function formatDate(iso, { year = true } = {}) {
  return toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}) });
}

// A date range: "Nov 26–27" in one month, "Dec 24 – Jan 1" across months, "Dec 9" for one day.
function formatRange(startISO, endISO) {
  if (startISO === endISO) return formatDate(startISO, { year: false });
  const start = toDate(startISO);
  const end = toDate(endISO);
  if (start.getMonth() === end.getMonth()) return `${formatDate(startISO, { year: false })}–${end.getDate()}`;
  return `${formatDate(startISO, { year: false })} – ${formatDate(endISO, { year: false })}`;
}

// Ranges look better with an en dash: "3:30-4:30 PM" → "3:30–4:30 PM"
const dash = (text) => (text ?? "").replace("-", "–");

// The most common value in a list, e.g. the usual practice time.
function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Days as a short range: ["Monday", …, "Thursday"] → "Monday–Thursday".
function dayRange(dayNames) {
  const used = WEEKDAYS.filter((day) => dayNames.includes(day));
  const indexes = used.map((day) => WEEKDAYS.indexOf(day));
  const consecutive = indexes.every((index, i) => i === 0 || index === indexes[i - 1] + 1);
  return used.length > 2 && consecutive ? `${used[0]}–${used.at(-1)}` : used.join(", ");
}

const isOff = (practice) => practice.status === "off";
// "Normal" isn't useful information, so only real notes count.
const realNote = (practice) => (practice.note && practice.note.toLowerCase() !== "normal" ? practice.note : "");

// ---------- 1. Regular schedule ----------

function showRegularSchedule(practices) {
  const held = practices.filter((p) => !isOff(p));
  if (!held.length) return;
  document.getElementById("usual-days").textContent = dayRange(held.map((p) => p.day?.long));
  document.getElementById("usual-time").textContent = dash(mostCommon(held.map((p) => p.time)));
  document.getElementById("usual-location").textContent = mostCommon(held.map((p) => p.location));
}

// ---------- 2. Week by week ----------

// One cell per practice day: the date in a tile ("Nov 24"). Practice = green, no practice = gray
// with the date crossed out. Desktop adds a brief label under the date — "Regular practice",
// "No practice", or the day's own note (e.g. "Season Start") — which phones skip for space.
function dayCell(practice) {
  // The space around each tile is the same on every side: the left + right padding of two
  // neighboring cells adds up to the gap between tiles, and it matches the top/bottom padding.
  // Phones: 2px + 2px = 4px between tiles, 4px above/below. Desktop: 4px + 4px = 8px, 8px above/below.
  // h-px + the tile's h-full: a table-cell trick that lets the tile stretch to the full row
  // height (rows are as tall as the two-line "Week 1" cell), so the space above and below each
  // tile is exactly the cell's padding.
  // The last column gets a little extra on the right so the last tile sits the same distance
  // from the card's edge as tiles sit from each other (4px phones, 8px desktop).
  const cell = el("td", "h-px px-0.5 py-1 last:pr-1 md:px-1 md:py-2 md:last:pr-2");
  if (!practice) return cell;
  const off = isOff(practice);

  // Equal padding inside (6px phones, 10px desktop); the tile fills the row height with its text centered.
  const tile = el("div", `flex h-full flex-col justify-center rounded-md p-1.5 text-center md:p-2.5 md:text-left ${off ? "bg-fg/5 text-fg-subtle" : "bg-accent/12"}`);
  tile.append(el("div", `text-[12px] font-medium whitespace-nowrap tabular-nums md:text-[13px]${off ? " line-through" : " text-accent"}`, formatDate(practice.date, { year: false })));
  const label = off ? "No practice" : realNote(practice) || "Regular practice";
  // Phones: hidden visually but still read by screen readers (sr-only); desktop: shown under the date.
  tile.append(el("div", `sr-only text-[11px] leading-tight md:not-sr-only${off ? "" : " text-fg-muted"}`, label));
  cell.append(tile);
  return cell;
}

// The practice days used this season, in week order, e.g. ["Monday", …, "Thursday"].
function seasonDays(practices) {
  return WEEKDAYS.filter((day) => practices.some((p) => p.day?.long === day));
}

function showHeader(days) {
  const head = document.getElementById("weeks-head");
  const th = (text, className) => {
    const cell = el("th", `py-2.5 font-semibold ${className}`, text);
    cell.scope = "col";
    return cell;
  };
  // Day headers: "Mon" on phones, "Monday" on desktop (one display class per element).
  const dayHeader = (day) => {
    const cell = th("", "px-0.5 text-center md:px-3 md:text-left");
    cell.append(el("span", "md:hidden", day.slice(0, 3)), el("span", "hidden md:inline", day));
    return cell;
  };
  head.replaceChildren(th("Week", "w-[24%] pr-1 pl-3 md:w-[16%] md:px-5"), ...days.map(dayHeader));
}

function weekRow(week, number, days, { isCurrent, today, inSeason }) {
  const practices = week.practices ?? [];
  const first = practices[0]?.date ?? week.weekStart;
  const last = practices.at(-1)?.date ?? week.weekEnd;
  const past = inSeason && last < today && !isCurrent; // dim finished weeks, only during the season

  // The same table row on every screen size; phones just use tighter spacing.
  const row = el("tr", `border-b border-line last:border-0${isCurrent ? " bg-highlight/10" : ""}${past ? " opacity-60" : ""}`);
  if (isCurrent) row.id = "this-week";

  // Week cell: "Week 3" over the date range, with the same sizes/weights as the main item in
  // Records/Roster rows: phones 12px semibold over 11px gray; desktop 13px regular over 12px gray.
  // Dates in the day tiles use medium weight, like record times.
  const weekCell = el("th", "py-2 pr-1 pl-3 text-left font-normal md:px-5 md:py-2.5");
  weekCell.scope = "row";
  weekCell.append(
    el("div", "text-[12px] font-semibold md:text-[13px] md:font-normal", `Week ${number}`), // like event / name cells in Records & Roster
    el("div", "type-small text-fg-subtle tabular-nums", formatRange(first, last)),
  );
  if (isCurrent) {
    const tagLine = el("div", "mt-1");
    tagLine.append(el("span", "rounded-sm bg-highlight px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-black", "This week"));
    weekCell.append(tagLine);
  }

  // One cell per practice day
  const byDay = new Map(practices.map((p) => [p.day?.long, p]));
  row.append(weekCell, ...days.map((day) => dayCell(byDay.get(day))));
  return row;
}

// ---------- Load everything ----------

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

async function loadPractices() {
  const body = document.getElementById("weeks-body");
  try {
    const data = await fetchJson("./assets/data/practice-schedule.json");
    const weeks = data.weeks ?? [];
    const practices = weeks.flatMap((w) => w.practices ?? []);
    const today = todayISO();

    if (data.season) document.getElementById("practice-season").textContent = dash(data.season);
    if (data.updated) document.getElementById("practice-updated").textContent = `Updated ${formatDate(data.updated)}`;

    // Dates are "YYYY-MM-DD" text, which compares correctly as text.
    const held = practices.filter((p) => !isOff(p));
    const lastHeld = held.at(-1)?.date ?? "";
    const inSeason = (held[0]?.date ?? "") <= today && today <= lastHeld;

    showRegularSchedule(practices);

    const days = seasonDays(practices);
    showHeader(days);
    const current = weeks.find((w) => w.weekStart <= today && today <= w.weekEnd);
    body.replaceChildren(
      ...weeks.map((week, index) => weekRow(week, index + 1, days, { isCurrent: week === current, today, inSeason })),
    );
  } catch (error) {
    console.error("Could not load practice schedule:", error);
    const row = el("tr");
    const cell = el("td", "px-4 py-6 text-center text-fg-subtle", "The practice schedule couldn't be loaded. Please try refreshing the page.");
    cell.colSpan = 5;
    row.append(cell);
    body.replaceChildren(row);
  }
}

loadPractices();
