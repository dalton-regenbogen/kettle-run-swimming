// Fills in the Team Roster page from assets/rosters/.
//
//   roster-index.json      lists the seasons (newest first) and each season's file
//   roster-YYYY-YYYY.json  one season: { season, updated, athletes: [...] }
//
// Expects these elements on the page:
//   #season-select               <select> of seasons
//   [data-team-filter] buttons   All / Boys / Girls
//   #roster-body                 <tbody> for the table
//   #roster-season               the "(2025–2026)" label beside the heading
//   #roster-updated              the "Updated …" pill in the hero band

const state = {
  athletes: [], // the season currently shown
  team: "All",  // "All" | "Boys" | "Girls"
};

// Each season load gets a number. If an older request finishes after a newer one
// (switching seasons quickly), its result is ignored so it can't overwrite the newer season.
let latestRequest = 0;

const tbody = document.getElementById("roster-body");

// Creates an element with classes and text. Using textContent (not innerHTML)
// means data can never be mistaken for HTML.
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

// "2026-02-11" → "Feb 11, 2026"
function formatDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "2025-2026" → "2025–2026" (a proper en dash for ranges)
function seasonText(label) {
  return label.replace("-", "–");
}

function athleteRow(athlete) {
  // Same text sizes as the Records tables: 12px on phones, 13px on desktop.
  const row = el("tr", "border-b border-line text-[12px] last:border-0 md:text-[13px]");

  // Roles can contain empty strings, so filter those out.
  const roles = (athlete.roles ?? []).filter(Boolean);
  const isCaptain = roles.includes("Captain");

  // Initials avatar
  const avatarCell = el("td", "py-2.5 pr-2 pl-3 md:px-4");
  const initials = `${athlete.first?.[0] ?? ""}${athlete.last?.[0] ?? ""}`.toUpperCase();
  avatarCell.append(el("span", "flex size-8 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white md:size-9", initials));

  // Name (semibold on phones, regular on desktop — like the event names in Records),
  // a yellow "Captain" badge for captains (same style as "State Record" on Records),
  // and "Girls Team" plus any other roles underneath.
  const nameCell = el("td", "py-2.5 pr-2 md:px-4");
  const nameLine = el("div", "flex flex-wrap items-center gap-x-1.5 font-semibold md:font-normal");
  nameLine.append(el("span", "", `${athlete.first ?? ""} ${athlete.last ?? ""}`.trim()));
  if (isCaptain) {
    nameLine.append(el("span", "rounded-sm bg-badge px-1 py-0.5 text-[9px] leading-none font-semibold text-badge-fg md:text-[10px]", "Captain"));
  }
  const otherRoles = roles.filter((role) => role !== "Captain");
  const subline = [athlete.team ? `${athlete.team} Team` : "", ...otherRoles].filter(Boolean).join(" · ");
  nameCell.append(nameLine, el("div", "type-small text-fg-subtle", subline));

  row.append(
    avatarCell,
    nameCell,
    el("td", "py-2.5 pr-2 md:px-4", athlete.yearOnTeam ?? ""),
    el("td", "py-2.5 pr-2 md:px-4", athlete.class ?? ""),
    el("td", "py-2.5 pr-3 md:px-4", athlete.stroke ?? ""),
  );
  return row;
}

function showMessage(message) {
  const row = el("tr");
  const cell = el("td", "px-4 py-6 text-center text-fg-subtle", message);
  cell.colSpan = 5;
  row.append(cell);
  tbody.replaceChildren(row);
}

// Draws the table for the current season and team filter, sorted by last name, then first.
function render() {
  const athletes = state.athletes
    .filter((a) => state.team === "All" || a.team === state.team)
    .sort((a, b) => (a.last ?? "").localeCompare(b.last ?? "") || (a.first ?? "").localeCompare(b.first ?? ""));

  if (athletes.length === 0) {
    // A season with no swimmers yet (the roster is set after the first week of practice), or a
    // Boys/Girls filter with nobody in it.
    const notPosted = state.athletes.length === 0 && state.season;
    showMessage(notPosted ? `The ${seasonText(state.season)} roster will be posted after the first week of practice.` : "No swimmers listed.");
    return;
  }
  tbody.replaceChildren(...athletes.map(athleteRow));
}

async function loadSeason(file) {
  const request = ++latestRequest;
  try {
    const data = await fetchJson(`./assets/rosters/${file}`);
    if (request !== latestRequest) return; // a newer season was picked meanwhile

    state.athletes = data.athletes ?? [];
    state.season = data.season;
    document.getElementById("roster-season").textContent = data.season ? `(${seasonText(data.season)})` : "";
    document.getElementById("roster-updated").textContent = data.updated ? `Last updated ${formatDate(data.updated)}` : "";
    render();
  } catch (error) {
    if (request !== latestRequest) return;
    console.error("Could not load roster:", error);
    showMessage("The roster couldn't be loaded. Please try refreshing the page.");
  }
}

function setupTeamFilter() {
  const buttons = document.querySelectorAll("[data-team-filter]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      state.team = button.dataset.teamFilter;
      // aria-pressed tells screen readers which is chosen; the aria-pressed: classes style it.
      for (const other of buttons) other.setAttribute("aria-pressed", String(other === button));
      render();
    });
  }
}

async function init() {
  setupTeamFilter();
  const select = document.getElementById("season-select");

  try {
    const index = await fetchJson("./assets/rosters/roster-index.json");
    const seasons = index.seasons ?? [];
    select.replaceChildren(...seasons.map((s) => {
      const option = el("option", "", seasonText(s.label));
      option.value = s.file;
      return option;
    }));
    select.addEventListener("change", () => loadSeason(select.value));

    if (seasons.length) loadSeason(seasons[0].file); // newest season first
    else showMessage("No seasons listed yet.");
  } catch (error) {
    console.error("Could not load the season list:", error);
    showMessage("The roster couldn't be loaded. Please try refreshing the page.");
  }
}

init();
