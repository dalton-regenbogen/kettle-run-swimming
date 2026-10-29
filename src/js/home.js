// Fills in the home page: the season-aware "Right now" card, the important dates, and the
// season-aware parts of the hero. It reads the same data as the other pages:
//   assets/meets/meets-index.json → the newest season's meets and results
//   assets/data/practice-schedule.json
//   assets/data/importantDates.json   { seasonLabel, items: [{ date, name, details }] } — team events
//
// The page shifts with the season:
//   preseason  (before the first practice, or from August after last season ended)
//              → "Join the team"
//   in season  (first practice → last meet) → "This week": next meet, this week's practices,
//              latest result
//   offseason  (after the last meet, until August) → a recap of the season that just ended
//
// To preview another time of year, add ?date=2026-01-14 to the page address.
//
// Below the hero (drawn into #home-sections): the "Right now" card, then "Up next" dates.

// Today's date as "YYYY-MM-DD" (or the ?date= override).
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
const toISO = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "2026-01-16" → "Jan 16" (or "Jan 16, 2026" with { year: true })
const formatDate = (iso, { year = false } = {}) =>
  toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}) });
// "2026-01-16" → "Fri"
const weekday = (iso) => toDate(iso).toLocaleDateString("en-US", { weekday: "short" });

// "18:00" → "6:00 PM"
function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th"
function ordinal(n) {
  const teens = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teens ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th")}`;
}

// The school year a date belongs to: Aug 2026 – Jul 2027 → "2026–2027" (same rule as the footer).
function schoolYear(iso) {
  const date = toDate(iso);
  const start = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}–${start + 1}`;
}

// The next season to start: in Aug–Dec that's this school year; in Jan–Jul it's the one starting
// this coming August. (Mar 2026 → "2026–2027"; Oct 2026 → "2026–2027".)
function upcomingSeason(iso) {
  const date = toDate(iso);
  return date.getMonth() >= 7 ? schoolYear(iso) : `${date.getFullYear()}–${date.getFullYear() + 1}`;
}

const dash = (text) => (text ?? "").replace("-", "–");
const isChampionship = (meet) => meet.type.includes("Championship");
const outcome = (score) => (score.us > score.them ? "W" : score.us < score.them ? "L" : "T");
const opponentNames = (meet) =>
  meet.opponents.map((o) => (o.full?.endsWith(" High School") ? o.full.slice(0, -" High School".length) : o.short)).join(", ");

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const TEAMS = [
  { key: "boys", label: "Boys" },
  { key: "girls", label: "Girls" },
];

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

// ---------- Small building blocks ----------

// "Meet schedule →": a plain accent text link, like "Full results" on the Results page.
function arrowLink(text, href) {
  const link = el("a", "type-small mt-3 inline-block font-medium text-accent underline-offset-2 hover:underline", `${text} →`);
  link.href = href;
  return link;
}

// A block inside the "This week" card: a small label ("NEXT MEET"), its lines, and a link.
function block(label, lines, link) {
  const box = el("div", "p-4 md:p-5");
  box.append(el("p", "type-label mb-1.5 font-semibold text-accent", label), ...lines);
  if (link) box.append(link);
  return box;
}

// Main line (12px phones / 13px desktop) and gray second line (11/12px), like table rows.
const mainLine = (text, extra = "") => el("p", `text-[12px] md:text-[13px] ${extra}`, text);
const grayLine = (text) => el("p", "type-small text-fg-subtle", text);

// ---------- Section cards ----------

// A section card like the ones on every page: green accent bar, title, subtitle, then the content.
function sectionCard(title, subtitle, ...content) {
  const card = el("section", "overflow-hidden rounded-2xl border border-line bg-surface shadow-sm");
  const header = el("div", "flex items-center gap-3 border-b border-line px-4 py-4 md:px-5");
  const text = el("div");
  text.append(el("h2", "type-section", title));
  if (subtitle) text.append(el("p", "type-small text-fg-muted", subtitle));
  const bar = el("div", "h-9 w-1.5 shrink-0 rounded-full bg-accent");
  bar.setAttribute("aria-hidden", "true");
  header.append(bar, text);
  card.append(header, ...content);
  return card;
}

// Three blocks side by side (stacked on phones), divided by thin lines. Used by "Join the team"
// and "This week" so both cards have the same shape.
function threeBlocks(...blocks) {
  const grid = el("div", "grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0");
  grid.append(...blocks);
  return grid;
}

// "Fri, Oct 24" in medium weight, like dates in the tables.
const dateLine = (iso) => mainLine(`${weekday(iso)}, ${formatDate(iso)}`, "font-medium tabular-nums");

// ---------- "Right now" card ----------

// Preseason: how to join, as three steps. Dates come from the season's data:
//   1. the interest meeting (a team event in importantDates.json with "interest" in its name)
//   2. forms: where each one goes
//   3. the first week of practice (from the practice schedule): dates, time, place, and the forms deadline
//      (the last practice day of week 1)
function joinCard(season, items, today, practiceWeeks) {
  const interest = items.find((item) => /interest/i.test(item.name) && item.date >= today);
  const firstWeek = (practiceWeeks[0]?.practices ?? []).filter((p) => p.status !== "off");
  const [start, end] = [firstWeek[0], firstWeek.at(-1)];

  const interestLines = interest
    ? [dateLine(interest.date), ...(interest.details ? [grayLine(interest.details.replace(/\.$/, ""))] : [])]
    : [grayLine("Date to be announced")];
  const formsLines = [
    mainLine("Turn in four forms", "font-medium"), // medium, like the first line of the other two steps
    grayLine("Physical, concussion, and acknowledgement: Coach Dalton or the KRHS athletic department"),
    grayLine("Swim team contact form: Coach Dalton, in person or by email"),
  ];
  const weekLines = start
    ? [
        mainLine(`${weekday(start.date)}, ${formatDate(start.date)} – ${weekday(end.date)}, ${formatDate(end.date)}`, "font-medium tabular-nums"),
        grayLine(`${dash(start.time)} @ ${start.location}`),
        grayLine("Official intent to join"),
        grayLine(`Forms due by ${weekday(end.date)}, ${formatDate(end.date)}`),
      ]
    : [grayLine("Dates to be announced")];

  return sectionCard(
    "Join the team",
    `${season} season`,
    threeBlocks(
      block("1. Interest meeting", interestLines),
      block("2. Forms", formsLines, arrowLink("See the forms", "./join.html#forms-heading")),
      block("3. First week", weekLines, arrowLink("How joining works", "./join.html")),
    ),
  );
}

// In season: this week's practices, the latest result, and the next meet (in that order).
function thisWeekCard(today, meets, practiceWeeks) {
  // This week = Monday through Sunday around today.
  const monday = toDate(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // getDay(): Sunday 0 … Saturday 6
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const [weekStart, weekEnd] = [toISO(monday), toISO(sunday)];

  // Practices: "Mon, Jan 12 … Practice" / "Off". The usual time isn't repeated here (it's on the
  // Practices page); a day only shows a time when it's different from the season's usual time.
  const all = practiceWeeks.flatMap((w) => w.practices ?? []);
  const usualTime = mostCommon(all.filter((p) => p.status !== "off").map((p) => p.time));
  const week = all.filter((p) => p.date >= weekStart && p.date <= weekEnd);
  const practiceLines = week.length
    ? week.map((p) => {
        const off = p.status === "off";
        const line = el("p", "flex justify-between gap-3 text-[12px] leading-5 md:text-[13px]");
        line.append(
          el("span", `font-medium tabular-nums${off ? " text-fg-subtle line-through" : ""}`, `${weekday(p.date)}, ${formatDate(p.date)}`),
          el("span", "type-small text-fg-subtle", off ? "Off" : p.time !== usualTime ? dash(p.time) : "Practice"),
        );
        return line;
      })
    : [grayLine("No practice this week.")];

  // Latest result, spelled out so it can't be read as a score: "Won 2, lost 1", or "6th place".
  const latest = meets.filter((m) => m.results && m.date <= today).at(-1);
  let resultLines = [grayLine("No results yet this season.")];
  if (latest) {
    resultLines = [dateLine(latest.date), mainLine(latest.type, "mb-1")];
    for (const { key, label } of TEAMS) {
      const result = latest.results[key];
      let value = "–";
      if (result?.scores) {
        const wins = result.scores.filter((s) => outcome(s) === "W").length;
        const losses = result.scores.length - wins;
        const spelled = [wins ? `won ${wins}` : "", losses ? `lost ${losses}` : ""].filter(Boolean).join(", ");
        value = spelled.charAt(0).toUpperCase() + spelled.slice(1);
      } else if (result?.place) {
        value = `${ordinal(result.place)} place`;
      }
      const line = el("p", "flex justify-between gap-3 text-[12px] leading-5 md:text-[13px]");
      line.append(el("span", "type-small text-fg-subtle", label), el("span", "font-medium tabular-nums", value));
      resultLines.push(line);
    }
  }

  // Next meet that's still on
  const next = meets.find((m) => m.date >= today && !m.status);
  const nextLines = next
    ? [
        mainLine(`${weekday(next.date)}, ${formatDate(next.date)}, ${formatTime(next.startTime)}`, "font-medium tabular-nums"),
        mainLine(next.type),
        grayLine(isChampionship(next) ? opponentNames(next) : `vs ${opponentNames(next)}`),
        grayLine(`${next.homeAway} at ${next.locationFull}`),
      ]
    : [grayLine("No more meets this season.")];

  return sectionCard(
    "This week",
    `${weekday(weekStart)}, ${formatDate(weekStart)} – ${weekday(weekEnd)}, ${formatDate(weekEnd)}`,
    threeBlocks(
      block("Practice", practiceLines, arrowLink("Practice schedule", "./practice-schedule.html")),
      block("Latest result", resultLines, arrowLink("All scores and results", "./results.html")),
      block("Next meet", nextLines, arrowLink("Meet schedule", "./competition-schedule.html")),
    ),
  );
}

// Offseason: the season that just ended — dual record and postseason places per team, spelled out
// ("6th at Regionals", "Districts canceled").
function recapCard(season, meets) {
  const championships = meets.filter(isChampionship);
  const short = (meet) => meet.type.replace(" Championship", "s"); // "Regional Championship" → "Regionals"
  const grid = el("div", "grid grid-cols-2 gap-2 p-3 md:gap-3 md:p-4");
  for (const { key, label } of TEAMS) {
    const outcomes = meets.flatMap((m) => m.results?.[key]?.scores ?? []).map(outcome);
    const wins = outcomes.filter((o) => o === "W").length;
    const panel = el("div", "rounded-lg border border-line px-3 py-2.5 text-center md:text-left");
    panel.append(
      el("p", "type-label mb-1 font-semibold text-accent", label),
      mainLine(`${wins}–${outcomes.length - wins}`, "font-medium tabular-nums"),
      grayLine("Dual meet record"),
    );
    const post = el("div", "mt-2 border-t border-line pt-2 text-[12px] leading-5 md:text-[13px]");
    for (const meet of championships) {
      const place = meet.results?.[key]?.place;
      const line = el("p");
      if (meet.status) line.append(el("span", "text-fg-subtle", `${short(meet)} ${meet.status}`));
      else if (place) line.append(el("span", "font-medium tabular-nums", ordinal(place)), el("span", "text-fg-muted", ` at ${short(meet)}`));
      else line.append(el("span", "text-fg-subtle", `${short(meet)}: –`));
      post.append(line);
    }
    panel.append(post);
    grid.append(panel);
  }
  const links = el("div", "flex gap-4 px-4 pb-4 md:px-5");
  links.append(arrowLink("Season results", "./results.html"), arrowLink("Team records", "./team-records.html"));
  for (const link of links.children) link.classList.remove("mt-3");
  return sectionCard(`${season} season recap`, "Final results", grid, links);
}

// ---------- Up next: what goes in the list ----------
//
// Team events come from importantDates.json. Added automatically from the other data:
//   - first and last practice (practice-schedule.json)
//   - championship meets (the season's meet file)
// If a team event is on the same day as an automatic item, the team event wins (no duplicates).

function seasonDates(data, meets, practiceWeeks) {
  const items = (data.items ?? []).map((item) => ({ ...item }));
  const taken = new Set(items.map((item) => item.date));
  const auto = [];
  const held = practiceWeeks.flatMap((w) => w.practices ?? []).filter((p) => p.status !== "off");
  if (held.length) {
    auto.push({ date: held[0].date, name: "First practice", details: `${dash(held[0].time)} @ ${held[0].location}` });
    auto.push({ date: held.at(-1).date, name: "Last practice", details: `${dash(held.at(-1).time)} @ ${held.at(-1).location}` });
  }
  for (const meet of meets.filter(isChampionship)) {
    auto.push({ date: meet.date, name: meet.type, details: `${formatTime(meet.startTime)} @ ${meet.locationFull}`, status: meet.status, meet: true });
  }
  for (const item of auto) if (!taken.has(item.date)) items.push(item);
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Up next: how it looks ----------

// The date as a small solid block: "NOV" over a big "10". School green for team events and practices;
// school orange for meets, so competitions stand out. Orange uses black text (white on orange is hard to read).
function dateBlock(iso, { meet = false } = {}) {
  const colors = meet ? "bg-highlight text-black" : "bg-brand text-white";
  const mark = el("div", `flex w-11 shrink-0 flex-col items-center rounded-lg py-1 ${colors}`);
  mark.append(
    el("span", `type-label font-semibold ${meet ? "text-black/70" : "text-white/80"}`, toDate(iso).toLocaleDateString("en-US", { month: "short" })),
    el("span", "font-display text-[17px] leading-tight font-semibold tabular-nums", String(toDate(iso).getDate())),
  );
  return mark;
}

// One date: the green block, then the name (+ a status tag) over the details.
function dateItem(item, today) {
  const row = el("li", `flex items-start gap-3 px-4 py-3 md:px-5 lg:p-0${item.date < today ? " opacity-55" : ""}`);
  const text = el("div", "min-w-0 pt-0.5");
  const top = el("div", "flex flex-wrap items-center gap-x-1.5 gap-y-1");
  top.append(el("span", "text-[12px] font-semibold md:text-[13px]", item.name));
  if (item.status) top.append(el("span", "rounded-sm bg-fg/10 px-1 py-0.5 text-[9px] leading-none font-semibold md:text-[10px]", item.status.charAt(0).toUpperCase() + item.status.slice(1)));
  text.append(top);
  if (item.details) text.append(grayLine(item.details.replace(/\.$/, "")));
  row.append(dateBlock(item.date, { meet: item.meet }), text);
  return row;
}

// Laptops and up (lg): rows of three dates, read left to right like a calendar.
// Phones and tablets: one date per row. Either way, one full-width line separates rows: on small
// screens each date has its own padding and line (divide-y), and from lg the row takes over.
function dateRows(items, today) {
  const wrap = el("div", "divide-y divide-line");
  for (let i = 0; i < items.length; i += 3) {
    const row = el("div", "lg:px-5 lg:py-4");
    const list = el("ul", "divide-y divide-line lg:grid lg:grid-cols-3 lg:gap-4 lg:divide-y-0");
    list.append(...items.slice(i, i + 3).map((item) => dateItem(item, today)));
    row.append(list);
    wrap.append(row);
  }
  return wrap;
}

// Up next: the next 6 dates; "Show all season dates" swaps in the whole season (past ones dimmed).
function upNextCard(items, today) {
  const upcoming = items.filter((item) => item.date >= today);
  if (!upcoming.length) {
    return sectionCard("Up next", `${upcomingSeason(today)} season`, el("p", "type-small px-4 py-4 text-fg-subtle md:px-5", `Dates for the ${upcomingSeason(today)} season will be posted soon.`));
  }
  const short = dateRows(upcoming.slice(0, 6), today);
  const full = dateRows(items, today);
  full.hidden = true;
  const card = sectionCard("Up next", "Team events, practices, and championships", short, full);
  if (items.length > 6 || upcoming.length < items.length) {
    const footer = el("div", "border-t border-line px-4 py-3 md:px-5");
    const button = el("button", "type-small cursor-pointer font-medium text-accent underline-offset-2 hover:underline", "Show all season dates");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const open = full.hidden;
      full.hidden = !open;
      short.hidden = open;
      button.textContent = open ? "Show upcoming only" : "Show all season dates";
      button.setAttribute("aria-expanded", String(open));
    });
    footer.append(button);
    card.append(footer);
  }
  return card;
}

// ---------- Below the hero ----------

function drawSections(state) {
  const { phase, today, meets, practiceWeeks, season, dates } = state;
  const items = seasonDates(dates, meets, practiceWeeks);
  let now;
  if (phase === "season") now = thisWeekCard(today, meets, practiceWeeks);
  else if (phase === "offseason") now = recapCard(dash(season.season), meets);
  else now = joinCard(schoolYear(today), items, today, practiceWeeks);
  document.getElementById("home-sections").replaceChildren(now, upNextCard(items, today));
}

// ---------- Hero ----------

function setHero(phase, today) {
  const button = document.getElementById("hero-action");
  const [text, href] = {
    preseason: ["Tryout information", "./join.html"],
    season: ["Meet schedule", "./competition-schedule.html"],
    offseason: ["Season results", "./results.html"],
  }[phase];
  button.textContent = text;
  button.href = href;
  document.getElementById("hero-season").textContent = schoolYear(today);
}

// ---------- Load everything ----------

async function loadHome() {
  const today = todayISO();
  const [index, practices, dates] = await Promise.all([
    fetchJson("./assets/meets/meets-index.json"),
    fetchJson("./assets/data/practice-schedule.json").catch(() => ({ weeks: [] })),
    fetchJson("./assets/data/importantDates.json").catch(() => ({ items: [] })),
  ]);
  const season = await fetchJson(`./assets/meets/${index.seasons[0].file}`);
  const meets = season.meets ?? [];
  const practiceWeeks = practices.weeks ?? [];

  // Where are we in the season? Dates are "YYYY-MM-DD" text, which compares correctly as text.
  const firstPractice = practiceWeeks[0]?.practices?.[0]?.date;
  const seasonStart = [firstPractice, meets[0]?.date].filter(Boolean).sort()[0];
  const seasonEnd = meets.at(-1)?.date;
  let phase;
  if (seasonStart && today < seasonStart) phase = "preseason";
  else if (seasonStart && today <= seasonEnd) phase = "season";
  else phase = Number(today.slice(5, 7)) >= 8 ? "preseason" : "offseason"; // from August: next season

  setHero(phase, today);
  const state = { phase, today, meets, practiceWeeks, season, dates };
  drawSections(state);
}

loadHome().catch((error) => {
  console.error("Could not load the home page data:", error);
  document.getElementById("home-sections").replaceChildren(el("p", "type-small text-fg-subtle", "This section couldn't be loaded. Please try refreshing the page."));
});
