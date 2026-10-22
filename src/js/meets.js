// Fills in the Meet Schedule page with the newest season in assets/meets/.
//
//   meets-index.json        lists the seasons (newest first) and each season's file
//   meets-2025-2026.json    one season: { season, updated, meets: [...] }
//
// Each meet:
//   { date: "2025-12-06", type, opponents: [{ short, full }], homeAway, hostSchool,
//     location, locationFull, startTime: "18:00", seasonDesignation,
//     status (optional, e.g. "canceled"), statusNote (optional, e.g. "Weather"),
//     results (optional; used by the Results page, see js/results.js) }
//
// Expects these elements on the page:
//   #meets-body          the "Loading…" <tbody> (replaced by one <tbody> per part of the season)
//   #meets-season        the season in the hero ("2025–2026")
//   #meets-updated       the "Last updated …" label in the hero
//
// Each row has two sets of cells (one display class each, never both):
//   phones  → Date / weekday · Meet / opponents / pool · Time / Home-Away   (md:hidden)
//   desktop → Date / weekday · Meet / opponents · Location / Home-Away + host · Time   (hidden md:table-cell)

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

// "2025-12-06" → "Dec 6, 2025" (or "Dec 6" with { year: false })
function formatDate(iso, { year = true } = {}) {
  return toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}) });
}

// "2025-12-06" → "Sat"
const weekday = (iso) => toDate(iso).toLocaleDateString("en-US", { weekday: "short" });

// "18:00" → "6:00 PM"
function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Opponents as readable names: "Brentsville District, Sherando".
// School names drop "High School"; championships use their short name ("Northwestern District").
function opponentNames(meet) {
  return (meet.opponents ?? [])
    .map((o) => (o.full?.endsWith(" High School") ? o.full.slice(0, -" High School".length) : o.short))
    .join(", ");
}

const isChampionship = (meet) => meet.type.includes("Championship");

// "vs Brentsville District, Sherando", or just "Northwestern District" for a championship.
const opponentLine = (meet) => (isChampionship(meet) ? opponentNames(meet) : `vs ${opponentNames(meet)}`);

// "canceled" → "Canceled · Weather"
function statusText(meet) {
  const status = meet.status.charAt(0).toUpperCase() + meet.status.slice(1);
  return meet.statusNote ? `${status} · ${meet.statusNote}` : status;
}

// A small tag after the meet name. Same shape as the badges on Records/Roster.
const tag = (text, colors) => el("span", `shrink-0 rounded-sm px-1 py-0.5 text-[9px] leading-none font-semibold md:text-[10px] ${colors}`, text);

// The meet type with its tags ("Next meet", "Canceled · Weather") after it.
function nameWithTags(meet, { isNext }, nameClass) {
  const line = el("div", "flex flex-wrap items-center gap-x-1.5 gap-y-1");
  line.append(el("span", nameClass, meet.type));
  if (isNext) line.append(tag("Next meet", "bg-highlight text-black"));
  if (meet.status) line.append(tag(statusText(meet), "bg-fg/10 text-fg"));
  return line;
}

// The time, crossed out when the meet isn't happening.
const timeClass = (meet) => `font-medium whitespace-nowrap tabular-nums${meet.status ? " line-through" : ""}`;

function rowClass(meet, { isNext, isPast }) {
  return `border-b border-line last:border-0${isNext ? " bg-highlight/10" : ""}${isPast || meet.status ? " opacity-60" : ""}`;
}

// ---------- Desktop cells ----------
// Date · Meet · Location · Time. Main items 13px regular, second lines 12px gray.

function desktopCells(meet, flags) {
  const date = el("td", "hidden px-5 py-2.5 align-top md:table-cell");
  date.append(el("div", "font-medium tabular-nums", formatDate(meet.date, { year: false })), el("div", "type-small text-fg-subtle", weekday(meet.date)));

  const name = el("td", "hidden px-5 py-2.5 align-top md:table-cell");
  name.append(nameWithTags(meet, flags, ""), el("div", "type-small text-fg-muted", opponentLine(meet)));

  const place = el("td", "hidden px-5 py-2.5 align-top md:table-cell");
  place.append(el("div", "", meet.locationFull), el("div", "type-small text-fg-subtle", `${meet.homeAway} · Hosted by ${meet.hostSchool}`));

  const time = el("td", `hidden px-5 py-2.5 align-top md:table-cell ${timeClass(meet)}`, formatTime(meet.startTime));
  return [date, name, place, time];
}

// ---------- One row: phone cells, then desktop cells ----------
// Phones: 12px; the meet name semibold, dates/times medium, second lines 11px gray.

function meetRow(meet, flags) {
  const row = el("tr", rowClass(meet, flags));
  const date = el("td", "py-2.5 pr-1 pl-3 align-top md:hidden");
  date.append(el("div", "text-[12px] font-medium whitespace-nowrap tabular-nums", formatDate(meet.date, { year: false })), el("div", "type-small text-fg-subtle", weekday(meet.date)));

  const name = el("td", "py-2.5 pr-2 align-top md:hidden");
  name.append(
    nameWithTags(meet, flags, "text-[12px] font-semibold"),
    el("div", "type-small text-fg-muted", opponentLine(meet)),
    el("div", "type-small text-fg-subtle", meet.locationFull),
  );

  const time = el("td", "py-2.5 pr-3 align-top md:hidden");
  time.append(el("div", `text-[12px] ${timeClass(meet)}`, formatTime(meet.startTime)), el("div", "type-small text-fg-subtle", meet.homeAway));

  row.append(date, name, time, ...desktopCells(meet, flags));
  return row;
}

// One part of the season (e.g. "Regular Season") as its own <tbody>, headed by a
// <th scope="rowgroup"> — the same grouping as Individual / Relays on the Records page.
// Its left padding matches the Date column (12px phones, 20px desktop) so the heading lines up.
function groupBody(label, meets, flags) {
  const tbody = el("tbody");
  const headingRow = el("tr");
  const heading = el("th", "type-label border-b border-line px-3 pt-5 pb-2 text-left font-semibold text-fg-muted md:px-5", label);
  heading.scope = "rowgroup";
  heading.colSpan = 4;
  headingRow.append(heading);
  tbody.append(headingRow, ...meets.map((meet) => meetRow(meet, flags(meet))));
  return tbody;
}

// ---------- Load everything ----------

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

async function loadMeets() {
  const body = document.getElementById("meets-body");
  try {
    const index = await fetchJson("./assets/meets/meets-index.json");
    const newest = index.seasons?.[0];
    if (!newest) throw new Error("No seasons in meets-index.json");
    const data = await fetchJson(`./assets/meets/${newest.file}`);
    const meets = data.meets ?? [];

    if (data.season) document.getElementById("meets-season").textContent = data.season.replace("-", "–");
    if (data.updated) document.getElementById("meets-updated").textContent = `Last updated ${formatDate(data.updated)}`;

    // The next meet that's still on. Dates are "YYYY-MM-DD" text, which compares correctly as text.
    // Finished meets are dimmed only while there's still a meet to come (not in the offseason).
    const today = todayISO();
    const next = meets.find((m) => m.date >= today && !m.status);
    const flags = (meet) => ({ isNext: meet === next, isPast: Boolean(next) && meet.date < today });

    // Group by seasonDesignation, keeping the order the meets are listed in.
    const groups = new Map();
    for (const meet of meets) {
      const label = meet.seasonDesignation || "Meets";
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(meet);
    }
    body.replaceWith(...[...groups].map(([label, group]) => groupBody(label, group, flags)));
  } catch (error) {
    console.error("Could not load meet schedule:", error);
    const row = el("tr");
    const cell = el("td", "px-4 py-6 text-center text-fg-subtle", "The meet schedule couldn't be loaded. Please try refreshing the page.");
    cell.colSpan = 4;
    row.append(cell);
    body.replaceChildren(row);
  }
}

loadMeets();
