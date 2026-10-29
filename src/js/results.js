// Fills in the Meet Results page from the season files in assets/meets/ (the same files as the
// Meet Schedule page). Each meet can have a `results` section:
//
//   dual meets:     "results": { "pdf": "https://…",
//                     "boys":  { "scores": [{ "vs": "BDHS", "us": 90, "them": 130 }, …] },
//                     "girls": { "scores": [ … ] } }
//   championships:  "results": { "pdf": "https://…",
//                     "boys":  { "place": 6, "standings": ["Goochland", "Meridian", …] },
//                     "girls": { "place": 1, "standings": [ … ] } }
//
// "vs" is the opponent's short name from the meet's "opponents" list; "us" is Kettle Run's score.
// "pdf" and "standings" can be left empty ("" / []).
//
// Expects these elements on the page:
//   #season-select                  season picker (hidden when there's only one season)
//   #results-season, #results-updated   hero band
//   #summary-table, #summary-head   season summary table (desktop)
//   #summary-phone                  season summary table (phones)
//   #regular-cards, #post-cards     where the meet cards go

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

// 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th", 22 → "22nd"
function ordinal(n) {
  const teens = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teens ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

const isChampionship = (meet) => meet.type.includes("Championship");

// "canceled" → "Canceled (weather)"
function statusText(meet) {
  const status = meet.status.charAt(0).toUpperCase() + meet.status.slice(1);
  return meet.statusNote ? `${status} (${meet.statusNote.toLowerCase()})` : status;
}

const TEAMS = [
  { key: "boys", label: "Boys" },
  { key: "girls", label: "Girls" },
];

// W, L, or T for one score
const outcome = (score) => (score.us > score.them ? "W" : score.us < score.them ? "L" : "T");

// ---------- Season summary ----------

// "District Championship" → "Districts"
function postseasonLabel(meet) {
  const short = { "District Championship": "Districts", "Regional Championship": "Regionals", "State Championship": "States" };
  return short[meet.type] ?? meet.type;
}

// "6th", "Canceled", or "–" (not swum yet)
function postseasonPlace(meet, team) {
  if (meet.status) return meet.status.charAt(0).toUpperCase() + meet.status.slice(1);
  const place = meet.results?.[team]?.place;
  return place ? ordinal(place) : "–";
}

// Everything the summary shows for one team, counted from the dual-meet scores.
function teamSummary(meets, team) {
  const outcomes = meets.flatMap((m) => m.results?.[team]?.scores ?? []).map(outcome);
  const count = (letter) => outcomes.filter((o) => o === letter).length;
  const [wins, losses, ties] = ["W", "L", "T"].map(count);

  // Streak: how many results in a row, counting back from the last one, match the last one.
  const last = outcomes.at(-1);
  let streak = 0;
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === last; i--) streak++;
  const streakWord = { W: "Won", L: "Lost", T: "Tied" }[last];

  return {
    record: ties ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`,
    winPct: outcomes.length ? `${Math.round((wins / outcomes.length) * 100)}%` : "–",
    streak: last ? `${streakWord} ${streak}` : "–",
  };
}

const th = (text, className) => {
  const cell = el("th", `py-2.5 text-left font-semibold ${className}`, text);
  cell.scope = "col";
  return cell;
};

// Desktop: one row per team, with a grouping header row; a thin vertical line separates the
// regular season from the postseason.
//                 | Regular season          | Postseason
//          Team   | Record · Win % · Streak | Districts · Regionals · States
function showDesktopSummary(meets, championships) {
  const divider = "border-l border-white/20"; // in the green header
  const cellDivider = "border-l border-line"; // in the rows

  // Top header row: "Regular season" spans 3 columns, "Postseason" one per championship.
  // scope="colgroup" tells screen readers these name a group of columns. "Team" spans both rows.
  const group = (text, columns, extra = "") => {
    const cell = el("th", `type-label px-5 pt-2.5 pb-0.5 text-left font-semibold text-white/70 ${extra}`, text);
    cell.scope = "colgroup";
    cell.colSpan = columns;
    return cell;
  };
  const column = (text, extra = "") => {
    const cell = el("th", `px-5 pt-0.5 pb-2.5 text-left font-semibold ${extra}`, text);
    cell.scope = "col";
    return cell;
  };
  const team = el("th", "w-[16%] px-5 py-2.5 text-left align-bottom font-semibold", "Team");
  team.scope = "col";
  team.rowSpan = 2;
  const groupRow = el("tr");
  groupRow.append(team, group("Regular season", 3));
  if (championships.length) groupRow.append(group("Postseason", championships.length, divider));
  const columnRow = el("tr");
  columnRow.append(column("Record"), column("Win %"), column("Streak"), ...championships.map((m, i) => column(postseasonLabel(m), i === 0 ? divider : "")));
  document.getElementById("summary-head").replaceChildren(groupRow, columnRow);

  const rows = TEAMS.map(({ key, label }) => {
    const summary = teamSummary(meets, key);
    const row = el("tr", "border-b border-line last:border-0");
    const name = el("th", "px-5 py-2.5 text-left font-normal", label);
    name.scope = "row";
    const cell = (text, extra = "") => el("td", `px-5 py-2.5 ${extra}`, text);
    row.append(
      name,
      cell(summary.record, "font-medium tabular-nums"),
      cell(summary.winPct, "tabular-nums"),
      cell(summary.streak),
      ...championships.map((m, i) => cell(postseasonPlace(m, key), `${m.status ? "text-fg-subtle" : "font-medium tabular-nums"}${i === 0 ? ` ${cellDivider}` : ""}`)),
    );
    return row;
  });
  const body = el("tbody");
  body.append(...rows);
  replaceBodies("summary-table", [body]);
}

// Phones: one row per stat, Boys and Girls as columns (values centered), grouped "Regular season"
// / "Postseason" like Individual / Relays on the Records page. The corner cell is left empty
// (screen readers hear "Stat").
function showPhoneSummary(meets, championships) {
  const summaries = Object.fromEntries(TEAMS.map(({ key }) => [key, teamSummary(meets, key)]));
  const table = el("table", "type-table w-full table-fixed");
  const head = el("thead", "bg-brand text-white");
  const headRow = el("tr");
  const corner = el("th", "w-[40%] py-2.5 pl-4 text-left font-semibold");
  corner.scope = "col";
  corner.append(el("span", "sr-only", "Stat"));
  headRow.append(corner, ...TEAMS.map(({ label }) => Object.assign(el("th", "py-2.5 text-center font-semibold", label), { scope: "col" })));
  head.append(headRow);

  // One group: a heading row ("REGULAR SEASON"), then a row per stat: [name, value for a team, extra classes].
  const group = (title, stats) => {
    const tbody = el("tbody");
    const headingRow = el("tr");
    const heading = el("th", "type-label border-b border-line px-4 pt-5 pb-2 text-left font-semibold text-fg-muted", title);
    heading.scope = "rowgroup";
    heading.colSpan = 3;
    headingRow.append(heading);
    tbody.append(headingRow);
    for (const [name, value, extra = ""] of stats) {
      const row = el("tr", "border-b border-line last:border-0 text-[12px]");
      const label = el("th", "py-2.5 pl-4 text-left font-semibold", name);
      label.scope = "row";
      row.append(label, ...TEAMS.map(({ key }) => el("td", `py-2.5 text-center tabular-nums ${extra}`, value(key))));
      tbody.append(row);
    }
    return tbody;
  };
  table.append(
    head,
    group("Regular season", [
      ["Record", (k) => summaries[k].record, "font-medium"],
      ["Win %", (k) => summaries[k].winPct],
      ["Streak", (k) => summaries[k].streak],
    ]),
  );
  if (championships.length) {
    table.append(group("Postseason", championships.map((m) => [postseasonLabel(m), (k) => postseasonPlace(m, k), m.status ? "text-fg-subtle" : "font-medium"])));
  }
  document.getElementById("summary-phone").replaceChildren(table);
}

function showSummary(meets) {
  const championships = meets.filter(isChampionship);
  showDesktopSummary(meets, championships);
  showPhoneSummary(meets, championships);
}

// Summary helpers: replace everything below a table's header with new <tbody>s.
function replaceBodies(tableId, bodies) {
  const table = document.getElementById(tableId);
  for (const old of table.querySelectorAll("tbody")) old.remove();
  table.append(...bodies);
}

function messageBody(text) {
  const tbody = el("tbody");
  const row = el("tr");
  const cell = el("td", "type-small px-3 py-2.5 text-fg-subtle md:px-5", text);
  cell.colSpan = 7;
  row.append(cell);
  tbody.append(row);
  return tbody;
}

// ---------- Meet cards ----------
//
// One card per meet, based on the original Results page:
//   desktop: [rail] | Saturday / Dec 6 / 6:00 PM | Double Dual, vs …, pool | Boys | Girls | links
//   phones:  rail strip on top, then a date line, the meet, the Boys/Girls panels, and the link —
//            everything centered, like the original page.
// The side-by-side layout starts at lg (1024px) rather than md: tablets don't have room for five
// columns, so they get the stacked layout. Font sizes still change at md, like other pages.
//
// Every card starts closed at the same height: each panel shows two 20px lines (leading-5) — the
// first result, then a "+2 more" button — and a long opponents list is cut to one line with "…".
// The button opens the card by adding a data-open attribute to it; elements inside use
// group-data-open: classes to change when it's there — e.g. `hidden group-data-open:block` on the
// extra results. (group on the card + group-data-open: on a child = "when the card has
// data-open".)
//
// Sizes follow the tables on other pages: main lines 12px phones / 13px desktop (dates and scores
// medium), second lines 11px / 12px gray.

const VISIBLE_SCORES = 1; // results shown per team before "+1 more"

// The Home/Away/Neutral strip, colored like the original: orange home, green away, black neutral.
const RAIL_COLORS = { Home: "bg-highlight text-black", Away: "bg-brand text-white", Neutral: "bg-fg text-page" };

const longWeekday = (iso) => toDate(iso).toLocaleDateString("en-US", { weekday: "long" });

// "18:00" → "6:00 PM"
function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Opponents as readable names: "Brentsville District, Sherando". Championships use their name.
function opponentNames(meet) {
  return meet.opponents.map((o) => (o.full?.endsWith(" High School") ? o.full.slice(0, -" High School".length) : o.short)).join(", ");
}

// "W KR 117–99 SHS" (like the original page): the letter carries the meaning; color just helps
// scanning. Schools are abbreviated so lines never wrap; hovering shows the full name.
function scoreLine(meet, score, extra) {
  const line = el("div", `whitespace-nowrap tabular-nums${extra ? " hidden group-data-open:block" : ""}`);
  const letter = outcome(score);
  line.append(
    el("span", `mr-1.5 font-semibold ${letter === "W" ? "text-accent" : "text-fg-subtle"}`, letter),
    el("span", "type-small mr-1 text-fg-subtle", "KR"),
    el("span", "font-medium", `${score.us}–${score.them}`),
    el("span", "type-small ml-1 text-fg-subtle", score.vs),
  );
  line.title = meet.opponents.find((o) => o.short === score.vs)?.full ?? score.vs;
  return line;
}

// The button on a panel's second line: "+2 more" / "Show less" (or "Show standings" / "Hide
// standings"). Every button in a card opens and closes the whole card, so Boys and Girls stay
// side by side. aria-expanded tells screen readers whether the card is open.
function toggleButton(card, closedText, openText) {
  const button = el("button", "type-small cursor-pointer font-medium text-accent underline-offset-2 hover:underline");
  button.type = "button";
  button.dataset.cardToggle = "";
  button.setAttribute("aria-expanded", "false");
  button.append(el("span", "group-data-open:hidden", closedText), el("span", "hidden group-data-open:inline", openText));
  button.addEventListener("click", () => {
    const open = card.toggleAttribute("data-open"); // adds or removes it; true when added
    for (const toggle of card.querySelectorAll("[data-card-toggle]")) toggle.setAttribute("aria-expanded", String(open));
  });
  return button;
}

// One team's panel: "BOYS" over two lines.
//   dual meet:     the first result, then "+2 more" (the rest appear when the card is open)
//   championship:  "6th of 10", then "Show standings"
//   no results:    "Canceled" over "Weather", or "–" over "After the meet"
function teamPanel(meet, team, label, card) {
  // Centered on phones and tablets (like the original page), left-aligned on laptops and up.
  const panel = el("div", "rounded-lg border border-line px-2.5 py-2 text-center lg:text-left");
  panel.append(el("p", "type-label mb-1 font-semibold text-fg-muted", label));
  // min-h-10 = two 20px lines, so a panel with only one line is still the same height.
  const body = el("div", "min-h-10 text-[12px] leading-5 md:text-[13px]");
  // Second lines are 11/12px gray but keep the 20px line height.
  const second = (text) => {
    const line = el("div");
    line.append(el("span", "type-small text-fg-subtle", text));
    return line;
  };
  const result = meet.results?.[team];

  if (meet.status) {
    body.append(el("div", "font-medium", meet.status.charAt(0).toUpperCase() + meet.status.slice(1)), second(meet.statusNote || "No results"));
  } else if (result?.scores) {
    body.append(...result.scores.map((score, i) => scoreLine(meet, score, i >= VISIBLE_SCORES)));
    const more = result.scores.length - VISIBLE_SCORES;
    if (more > 0) body.append(toggleButton(card, `+${more} more`, "Show less"));
  } else if (result?.place) {
    const standings = result.standings ?? [];
    const place = el("div", "font-medium tabular-nums", ordinal(result.place));
    if (standings.length) place.append(el("span", "type-small font-normal text-fg-subtle", ` of ${standings.length}`));
    body.append(place);
    if (standings.length) {
      const list = el("ol", "type-small mb-1 hidden space-y-0.5 text-fg-muted group-data-open:block");
      standings.forEach((name, i) => list.append(el("li", name === "Kettle Run" ? "font-semibold text-fg" : "", `${ordinal(i + 1)} ${name}`)));
      body.append(list, toggleButton(card, "Show standings", "Hide standings"));
    } else {
      body.append(second("Team place"));
    }
  } else {
    body.append(el("div", "font-medium text-fg-subtle", "–"), second("After the meet"));
  }
  panel.append(body);
  return panel;
}

// The plain "Full results" link (opens the PDF in a new tab).
function resultsLink(meet) {
  const link = el("a", "type-small font-medium text-accent underline-offset-2 hover:underline", "Full results");
  link.href = meet.results.pdf;
  link.target = "_blank";
  link.rel = "noreferrer"; // the new tab gets no access back to this page
  link.append(el("span", "sr-only", ` for ${meet.type} on ${formatDate(meet.date)} (PDF, opens in a new tab)`));
  return link;
}

function meetCard(meet) {
  const card = el("article", "group flex flex-col overflow-hidden rounded-xl border border-line bg-surface lg:flex-row");

  // Rail: a strip across the top on phones, a narrow column with sideways text on desktop.
  // [writing-mode:vertical-rl] turns the text sideways; rotate-180 makes it read bottom-to-top.
  const rail = el("div", `flex shrink-0 items-center justify-center py-1 lg:w-7 lg:py-0 ${RAIL_COLORS[meet.homeAway] ?? RAIL_COLORS.Neutral}`);
  rail.append(el("span", "type-label font-semibold lg:rotate-180 lg:[writing-mode:vertical-rl]", meet.homeAway));

  // Date: one line on phones; weekday / date / time stacked on desktop (date medium, like other tables).
  const phoneDate = el("p", "border-b border-line px-3 py-1.5 text-center text-[12px] font-medium lg:hidden", `${longWeekday(meet.date)}, ${formatDate(meet.date, { year: false })}, ${formatTime(meet.startTime)}`);
  const date = el("div", "hidden w-24 shrink-0 flex-col justify-center border-r border-line px-4 py-2.5 lg:flex");
  date.append(
    el("span", "type-small text-fg-subtle", longWeekday(meet.date)),
    el("span", "text-[13px] font-medium whitespace-nowrap tabular-nums", formatDate(meet.date, { year: false })),
    el("span", "type-small text-fg-subtle", formatTime(meet.startTime)),
  );

  // Meet: type (+ tag), opponents, then the pool in a gray chip. Closed, the opponents are cut to
  // one line; open, they wrap. (The host school is on the Meet Schedule page.)
  const info = el("div", "flex min-w-0 flex-col justify-center gap-0.5 border-b border-line px-3 py-2.5 text-center lg:w-72 lg:text-left lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4");
  const top = el("div", "flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 lg:justify-start");
  top.append(el("span", "text-[12px] font-semibold md:text-[13px] md:font-normal", meet.type));
  if (meet.status) top.append(el("span", "rounded-sm bg-fg/10 px-1 py-0.5 text-[9px] leading-none font-semibold text-fg md:text-[10px]", statusText(meet)));
  const opponents = isChampionship(meet) ? opponentNames(meet) : `vs ${opponentNames(meet)}`;
  const vs = el("p", "type-small truncate text-fg-muted group-data-open:whitespace-normal", opponents);
  vs.title = opponents;
  const pool = el("div", "mt-1");
  pool.append(el("span", "type-small rounded-md bg-fg/5 px-1.5 py-0.5 text-fg-muted", meet.locationFull));
  info.append(top, vs, pool);

  // Results: Boys and Girls side by side.
  const results = el("div", "grid flex-1 grid-cols-2 gap-2 px-3 py-2.5 lg:px-4");
  results.append(...TEAMS.map(({ key, label }) => teamPanel(meet, key, label, card)));

  // "Full results" link: a row under the panels on phones; a column on desktop (there even when
  // empty, so every card's panels line up).
  const links = el("div", "flex shrink-0 items-center justify-center px-3 pb-3 empty:hidden lg:w-28 lg:border-l lg:border-line lg:px-4 lg:pb-0 lg:empty:flex");
  if (meet.results?.pdf) links.append(resultsLink(meet));

  card.append(rail, phoneDate, date, info, results, links);
  return card;
}

function showCards(containerId, meets) {
  const container = document.getElementById(containerId);
  container.replaceChildren(...(meets.length ? meets.map(meetCard) : [el("p", "type-small text-fg-subtle", "No meets listed.")]));
}

// ---------- Load everything ----------

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

let latestRequest = 0;

async function showSeason(file) {
  const request = ++latestRequest;
  const data = await fetchJson(`./assets/meets/${file}`);
  if (request !== latestRequest) return; // a newer season was picked while this one loaded
  const meets = data.meets ?? [];

  document.getElementById("results-season").textContent = (data.season ?? "").replace("-", "–");
  // "Last updated": the date of the latest meet with results.
  const lastResult = meets.filter((m) => m.results).at(-1);
  document.getElementById("results-updated").textContent = lastResult ? `Last updated ${formatDate(lastResult.date)}` : "";

  showSummary(meets);
  showCards("regular-cards", meets.filter((m) => !isChampionship(m)));
  showCards("post-cards", meets.filter(isChampionship));
}

function showError(error) {
  console.error("Could not load results:", error);
  const message = "Results couldn't be loaded. Please try refreshing the page.";
  replaceBodies("summary-table", [messageBody(message)]);
  document.getElementById("summary-phone").replaceChildren(el("p", "type-small px-4 py-3 text-fg-subtle", message));
  for (const id of ["regular-cards", "post-cards"]) document.getElementById(id).replaceChildren(el("p", "type-small text-fg-subtle", message));
}

async function loadResults() {
  try {
    const index = await fetchJson("./assets/meets/meets-index.json");
    const seasons = index.seasons ?? [];
    if (!seasons.length) throw new Error("No seasons in meets-index.json");

    // Season picker: only shown when there's more than one season to pick from.
    const select = document.getElementById("season-select");
    select.replaceChildren(...seasons.map((s) => Object.assign(el("option", "", s.label.replace("-", "–")), { value: s.file })));
    select.closest("[data-season-picker]").hidden = seasons.length < 2;
    select.addEventListener("change", () => showSeason(select.value).catch(showError));

    await showSeason(seasons[0].file);
  } catch (error) {
    showError(error);
  }
}

loadResults();
