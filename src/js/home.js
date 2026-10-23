// Fills in the home page: the season-aware "Right now" card, the important dates, and the
// season-aware parts of the hero. It reads the same data as the other pages:
//   assets/meets/meets-index.json → the newest season's meets and results
//   assets/data/practice-schedule.json
//   assets/data/importantDates.json   { seasonLabel, items: [{ date, name, details }] }
//
// The page shifts with the season:
//   preseason  (before the first practice, or from August after last season ended)
//              → "Join the team"
//   in season  (first practice → last meet) → "This week": next meet, this week's practices,
//              latest result
//   offseason  (after the last meet, until August) → a recap of the season that just ended
//
// To preview another time of year, add ?date=2026-01-14 to the page address.

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
  box.append(el("p", "type-label mb-1.5 font-semibold text-fg-muted", label), ...lines);
  if (link) box.append(link);
  return box;
}

// Main line (12px phones / 13px desktop) and gray second line (11/12px), like table rows.
const mainLine = (text, extra = "") => el("p", `text-[12px] md:text-[13px] ${extra}`, text);
const grayLine = (text) => el("p", "type-small text-fg-subtle", text);

// ---------- "Right now" card ----------

function setCard(title, subtitle, ...content) {
  document.getElementById("now-title").textContent = title;
  document.getElementById("now-subtitle").textContent = subtitle;
  document.getElementById("now-body").replaceChildren(...content);
}

// Preseason: how to join.
function showJoin(season, nextDate) {
  const body = el("div", "p-4 md:p-5");
  body.append(
    el("p", "type-body max-w-prose text-fg-muted", `Want to swim for Kettle Run this winter? Tryout details, required forms, and key dates for the ${season} season are on the Join page. Questions are always welcome.`),
  );
  if (nextDate) {
    const next = el("p", "mt-3 text-[12px] md:text-[13px]");
    next.append(el("span", "font-semibold", "Next: "), `${nextDate.name}, ${weekday(nextDate.date)} ${formatDate(nextDate.date)}`);
    if (nextDate.details) next.append(el("span", "text-fg-subtle", ` · ${nextDate.details}`));
    body.append(next);
  }
  const buttons = el("div", "mt-4 flex flex-wrap gap-2");
  const primary = el("a", "type-button rounded-lg bg-accent px-3.5 py-2 text-on-accent transition-opacity hover:opacity-90", "Tryout information");
  primary.href = "./about.html"; // TODO: ./join.html once the Join page exists
  const secondary = el("a", "type-button rounded-lg border border-line px-3.5 py-2 text-fg transition-colors hover:border-fg-subtle", "Email the coach");
  secondary.href = "mailto:coachdtr@gmail.com";
  buttons.append(primary, secondary);
  body.append(buttons);
  setCard("Join the team", `${season} season`, body);
}

// In season: next meet, this week's practices, latest result.
function showThisWeek(today, meets, practiceWeeks) {
  // This week = Monday through Sunday around today.
  const monday = toDate(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // getDay(): Sunday 0 … Saturday 6
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const [weekStart, weekEnd] = [toISO(monday), toISO(sunday)];

  // Next meet that's still on
  const next = meets.find((m) => m.date >= today && !m.status);
  const nextLines = next
    ? [
        mainLine(`${weekday(next.date)}, ${formatDate(next.date)} · ${formatTime(next.startTime)}`, "font-medium tabular-nums"),
        mainLine(next.type, "mt-1"),
        grayLine(isChampionship(next) ? opponentNames(next) : `vs ${opponentNames(next)}`),
        grayLine(`${next.homeAway} · ${next.locationFull}`),
      ]
    : [grayLine("No more meets this season.")];

  // This week's practices: "Mon, Jan 12 · Practice" / "Off"
  const week = practiceWeeks.flatMap((w) => w.practices ?? []).filter((p) => p.date >= weekStart && p.date <= weekEnd);
  const practiceLines = week.length
    ? week.map((p) => {
        const line = el("p", "flex justify-between gap-3 text-[12px] leading-5 md:text-[13px]");
        line.append(
          el("span", `font-medium tabular-nums${p.status === "off" ? " text-fg-subtle line-through" : ""}`, `${weekday(p.date)}, ${formatDate(p.date)}`),
          el("span", "type-small text-fg-subtle", p.status === "off" ? "Off" : "Practice"),
        );
        return line;
      })
    : [grayLine("No practice this week.")];
  const held = week.filter((p) => p.status !== "off");
  if (held.length) practiceLines.push(grayLine(`${dash(mostCommon(held.map((p) => p.time)))} @ ${mostCommon(held.map((p) => p.location))}`));

  // Latest result: "Boys 2–0 · Girls 1–1" for a dual meet, "Girls 1st · Boys 6th" for a championship
  const latest = meets.filter((m) => m.results && m.date <= today).at(-1);
  let resultLines = [grayLine("No results yet this season.")];
  if (latest) {
    resultLines = [mainLine(`${weekday(latest.date)}, ${formatDate(latest.date)} · ${latest.type}`, "font-medium")];
    for (const { key, label } of TEAMS) {
      const result = latest.results[key];
      let value = "—";
      if (result?.scores) {
        const wins = result.scores.filter((s) => outcome(s) === "W").length;
        value = `${wins}–${result.scores.length - wins}`;
      } else if (result?.place) {
        value = ordinal(result.place);
      }
      const line = el("p", "flex justify-between gap-3 text-[12px] leading-5 md:text-[13px]");
      line.append(el("span", "type-small text-fg-subtle", label), el("span", "font-medium tabular-nums", value));
      resultLines.push(line);
    }
  }

  const grid = el("div", "grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0");
  grid.append(
    block("Next meet", nextLines, arrowLink("Meet schedule", "./competition-schedule.html")),
    block("Practice", practiceLines, arrowLink("Practice schedule", "./practice-schedule.html")),
    block("Latest result", resultLines, arrowLink("All results", "./results.html")),
  );
  setCard("This week", `${weekday(weekStart)}, ${formatDate(weekStart)} – ${weekday(weekEnd)}, ${formatDate(weekEnd)}`, grid);
}

// Offseason: the season that just ended — dual record and postseason places per team.
function showRecap(season, meets) {
  const championships = meets.filter(isChampionship);
  const grid = el("div", "grid grid-cols-2 gap-2 p-3 md:gap-3 md:p-4");
  for (const { key, label } of TEAMS) {
    const outcomes = meets.flatMap((m) => m.results?.[key]?.scores ?? []).map(outcome);
    const wins = outcomes.filter((o) => o === "W").length;
    const panel = el("div", "rounded-lg border border-line px-3 py-2.5 text-center md:text-left");
    panel.append(
      el("p", "type-label mb-1 font-semibold text-fg-muted", label),
      mainLine(`${wins}–${outcomes.length - wins}`, "font-medium tabular-nums"),
      grayLine("Dual meet record"),
    );
    const post = el("div", "mt-2 border-t border-line pt-2 text-[12px] leading-5 md:text-[13px]");
    for (const meet of championships) {
      const place = meet.status ? meet.status.charAt(0).toUpperCase() + meet.status.slice(1) : meet.results?.[key]?.place ? ordinal(meet.results[key].place) : "—";
      const line = el("p");
      line.append(el("span", meet.status ? "text-fg-subtle" : "font-medium tabular-nums", place), el("span", "type-small text-fg-subtle", ` ${meet.type.replace(" Championship", "s")}`));
      post.append(line);
    }
    panel.append(post);
    grid.append(panel);
  }
  const links = el("div", "flex gap-4 px-4 pb-4 md:px-5");
  links.append(arrowLink("Season results", "./results.html"), arrowLink("Team records", "./team-records.html"));
  for (const link of links.children) link.classList.remove("mt-3");
  setCard(`${season} season recap`, "Final results", grid, links);
}

// ---------- Important dates ----------

// Date · Event (details under the name). During the season, past dates are dimmed; once every
// date has passed, a note says the next season's dates are coming.
function showDates(data, today, phase) {
  const body = document.getElementById("dates-body");
  const items = data.items ?? [];
  const upcoming = items.filter((item) => item.date >= today);

  if (!upcoming.length && phase !== "season") {
    const next = upcomingSeason(today);
    document.getElementById("dates-subtitle").textContent = `${next} season`;
    document.getElementById("dates-head").hidden = true; // no column headers over a single note
    const row = el("tr");
    const cell = el("td", "type-small px-4 py-4 text-fg-subtle md:px-5", `Dates for the ${next} season will be posted soon.`);
    cell.colSpan = 2;
    row.append(cell);
    body.replaceChildren(row);
    return;
  }

  document.getElementById("dates-subtitle").textContent = `${dash(data.seasonLabel)} season`;
  document.getElementById("dates-head").hidden = false;
  body.replaceChildren(
    ...items.map((item) => {
      const row = el("tr", `border-b border-line last:border-0${item.date < today ? " opacity-60" : ""}`);
      const date = el("td", "py-2.5 pr-2 pl-4 align-top md:pl-5");
      date.append(el("div", "font-medium tabular-nums", formatDate(item.date)), el("div", "type-small text-fg-subtle", weekday(item.date)));
      const event = el("td", "py-2.5 pr-4 align-top md:pr-5");
      event.append(el("div", "font-semibold md:font-normal", item.name));
      if (item.details) event.append(el("div", "type-small text-fg-subtle", item.details));
      row.append(date, event);
      return row;
    }),
  );
}

// ---------- Hero ----------

function setHero(phase, today) {
  const button = document.getElementById("hero-action");
  const [text, href] = {
    preseason: ["Tryout information", "./about.html"], // TODO: ./join.html once the Join page exists
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
  if (phase === "season") showThisWeek(today, meets, practiceWeeks);
  else if (phase === "offseason") showRecap(dash(season.season), meets);
  else showJoin(schoolYear(today), (dates.items ?? []).find((item) => item.date >= today));
  showDates(dates, today, phase);
}

loadHome().catch((error) => {
  console.error("Could not load the home page data:", error);
  setCard("Kettle Run Swimming", "", el("p", "type-small p-4 text-fg-subtle", "This section couldn't be loaded. Please try refreshing the page."));
});
