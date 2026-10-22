// Fills in the Practice Schedule page from assets/data/practice-schedule.json.
//
// The practice JSON: { season, updated, weeks: [{ weekStart, weekEnd, practices: [...] }] }.
// Each practice: { day: { short, long }, date, time, location, status: "normal" | "off", note }.
//
// Expects these elements on the page:
//   #practice-season, #practice-updated   hero band
//   #regular-schedule                     the standard schedule line in the card header
//   #weeks-head, #weeks-body              the week-by-week table
//
// The table: Week · one column per practice day, on every screen size. Each day cell is the
// date over a gray label — "Regular practice" / "No practice" on desktop, "Practice" / "Off" on
// phones — the same two-line pairing as the Week cell ("Week 3" over "Nov 24–27").

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

// Days as text. Runs of three or more days get a dash, shorter ones a comma:
//   [Mon, Tue, Wed, Thu] → "Mon–Thu"   [Mon, Tue] → "Mon, Tue"   [Mon, Wed, Thu, Fri] → "Mon, Wed–Fri"
// Pass { long: true } for full names ("Monday–Thursday").
function dayList(dayNames, { long = false } = {}) {
  const used = WEEKDAYS.filter((day) => dayNames.includes(day));
  const name = (day) => (long ? day : day.slice(0, 3));
  const runs = [];
  for (const day of used) {
    const run = runs.at(-1);
    if (run && WEEKDAYS.indexOf(day) === WEEKDAYS.indexOf(run.at(-1)) + 1) run.push(day);
    else runs.push([day]);
  }
  return runs.map((run) => (run.length >= 3 ? `${name(run[0])}–${name(run.at(-1))}` : run.map(name).join(", "))).join(", ");
}

const isOff = (practice) => practice.status === "off";

// ---------- Standard schedule ----------

// Worked out from the practices:
//   desktop: "Standard practice schedule: Monday–Thursday, 3:30–4:30 PM @ WARF"
//   phones:  "Standard schedule: Mon–Thu, 3:30–4:30 PM @ WARF" (short enough for one line)
function showRegularSchedule(practices) {
  const held = practices.filter((p) => !isOff(p));
  if (!held.length) return;
  const dayNames = held.map((p) => p.day?.long);
  const time = dash(mostCommon(held.map((p) => p.time)));
  const location = mostCommon(held.map((p) => p.location));
  document.getElementById("regular-schedule").replaceChildren(
    el("span", "md:hidden", `Standard schedule: ${dayList(dayNames)}, `),
    el("span", "hidden md:inline", `Standard practice schedule: ${dayList(dayNames, { long: true })}, `),
    // The time and place stay together, so a very narrow phone wraps before them, not inside "3:30–4:30".
    el("span", "whitespace-nowrap", `${time} @ ${location}`),
  );
}

// ---------- Week by week ----------

// "Week 3" over "Nov 24–27", sized like the main item in Records/Roster rows:
// phones 12px semibold over 11px gray; desktop 13px regular over 12px gray.
function weekCell(week, number, isCurrent) {
  const practices = week.practices ?? [];
  const cell = el("th", "py-2.5 pr-1 pl-3 text-left align-top font-normal md:px-5");
  cell.scope = "row";
  cell.append(
    el("div", "text-[12px] font-semibold md:text-[13px] md:font-normal", `Week ${number}`),
    el("div", "type-small text-fg-subtle tabular-nums", formatRange(practices[0]?.date ?? week.weekStart, practices.at(-1)?.date ?? week.weekEnd)),
  );
  if (isCurrent) {
    const tagLine = el("div", "mt-1");
    tagLine.append(el("span", "rounded-sm bg-highlight px-1 py-0.5 text-[9px] font-semibold text-black md:text-[10px]", "This week"));
    cell.append(tagLine);
  }
  return cell;
}

const th = (text, className) => {
  const cell = el("th", `py-2.5 text-left font-semibold ${className}`, text);
  cell.scope = "col";
  return cell;
};

function showHead(days) {
  // Day headers: "Mon" on phones, "Monday" on desktop (one display class per element).
  const dayHeader = (day) => {
    const cell = th("", "px-1 last:pr-3 md:px-5");
    cell.append(el("span", "md:hidden", day.slice(0, 3)), el("span", "hidden md:inline", day));
    return cell;
  };
  document.getElementById("weeks-head").replaceChildren(th("Week", "w-[24%] pr-1 pl-3 md:w-[16%] md:px-5"), ...days.map(dayHeader));
}

// One day: the date ("Nov 24", medium weight like dates in the Meets table), gray and crossed
// out with no practice. Under it a 12px gray label (11px on phones), like the second lines in
// other tables: "Regular practice" / "No practice" on desktop, "Practice" / "Off" on phones.
function dayCell(practice) {
  const cell = el("td", "px-1 py-2.5 align-top last:pr-3 md:px-5");
  if (!practice) return cell;
  const off = isOff(practice);
  cell.append(el("div", `text-[12px] font-medium whitespace-nowrap tabular-nums md:text-[13px]${off ? " text-fg-subtle line-through" : ""}`, formatDate(practice.date, { year: false })));
  const label = el("div", "type-small text-fg-subtle");
  label.append(el("span", "md:hidden", off ? "Off" : "Practice"), el("span", "hidden md:inline", off ? "No practice" : "Regular practice"));
  cell.append(label);
  return cell;
}

function weekRow(week, number, days, { isCurrent, isPast }) {
  const row = el("tr", `border-b border-line last:border-0${isCurrent ? " bg-highlight/10" : ""}${isPast ? " opacity-60" : ""}`);
  const byDay = new Map((week.practices ?? []).map((p) => [p.day?.long, p]));
  row.append(weekCell(week, number, isCurrent), ...days.map((day) => dayCell(byDay.get(day))));
  return row;
}

// ---------- Load everything ----------

function showWeeks(weeks) {
  const practices = weeks.flatMap((w) => w.practices ?? []);
  const today = todayISO();

  // Dates are "YYYY-MM-DD" text, which compares correctly as text.
  const held = practices.filter((p) => !isOff(p));
  const inSeason = (held[0]?.date ?? "") <= today && today <= (held.at(-1)?.date ?? "");
  const current = weeks.find((w) => w.weekStart <= today && today <= w.weekEnd);
  const days = WEEKDAYS.filter((day) => practices.some((p) => p.day?.long === day));

  showHead(days);
  document.getElementById("weeks-body").replaceChildren(
    ...weeks.map((week, index) =>
      // Dim finished weeks, only during the season.
      weekRow(week, index + 1, days, { isCurrent: week === current, isPast: inSeason && week.weekEnd < today && week !== current }),
    ),
  );
}

async function loadPractices() {
  const body = document.getElementById("weeks-body");
  try {
    const response = await fetch("./assets/data/practice-schedule.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const weeks = data.weeks ?? [];

    if (data.season) document.getElementById("practice-season").textContent = dash(data.season);
    if (data.updated) document.getElementById("practice-updated").textContent = `Last updated ${formatDate(data.updated)}`;
    showRegularSchedule(weeks.flatMap((w) => w.practices ?? []));
    showWeeks(weeks);
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
