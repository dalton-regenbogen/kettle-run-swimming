// This study reads existing JSON. It does not edit data or publish changes.
const params = new URLSearchParams(window.location.search);
document.body.dataset.layout = params.get("layout") === "notebook" ? "notebook" : "fixtures";

const schoolTimezone = "America/New_York";
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: schoolTimezone, year: "numeric", month: "2-digit", day: "2-digit",
});
const today = dateFormatter.format(new Date());

// Optional archived date lets us review an in-season layout using real past data.
const requestedDate = params.get("date");
const validDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || "") &&
  !Number.isNaN(Date.parse(`${requestedDate}T12:00:00Z`)) &&
  new Date(`${requestedDate}T12:00:00Z`).toISOString().slice(0, 10) === requestedDate;
const calendarDate = validDate && requestedDate < today ? requestedDate : today;

function displayDate(iso, options = {}) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: schoolTimezone, month: "short", day: "numeric", ...options,
  });
}

function displayTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  if (!match) return "Time to be confirmed";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function renderMeet(data) {
  const meets = [...(data.meets || [])].sort((a, b) => a.date.localeCompare(b.date));
  const nextMeet = meets.find((meet) => meet.date >= calendarDate && !["cancelled", "canceled"].includes(meet.status));
  const mount = document.getElementById("meet-summary");
  if (!nextMeet) {
    mount.innerHTML = `<p class="detail-label">Meet schedule</p><h3>No upcoming meets listed.</h3><p class="supporting-copy">The published schedule ends ${escapeHtml(displayDate(meets.at(-1)?.date || calendarDate, { year: "numeric" }))}.</p><a class="text-link" href="./competition-schedule.html">View season schedule</a>`;
    return;
  }
  const opponents = (nextMeet.opponents || []).map((opponent) =>
    (opponent.full || opponent.short || "").replace(/ High School$/, "")
  ).join(" & ");
  const title = nextMeet.seasonDesignation === "Regular Season" ? `vs. ${opponents}` : nextMeet.type;
  mount.innerHTML = `<p class="detail-label">Next meet · ${escapeHtml(nextMeet.homeAway)}</p><h3>${escapeHtml(title)}</h3><div class="meet-details"><time datetime="${escapeHtml(nextMeet.date)}">${escapeHtml(displayDate(nextMeet.date, { weekday: "short" }))}</time><span>${escapeHtml(displayTime(nextMeet.startTime))}</span></div><p class="supporting-copy meet-venue">${escapeHtml(nextMeet.locationFull || nextMeet.location)}</p><a class="text-link" href="./competition-schedule.html">Meet details</a>`;
}

function renderPractice(data) {
  document.getElementById("calendar-season").textContent = (data.season || "").replace("-", "–");
  const weeks = data.weeks || [];
  const week = weeks.find((entry) => entry.weekStart <= calendarDate && entry.weekEnd >= calendarDate) ||
    weeks.find((entry) => entry.weekStart > calendarDate);
  const mount = document.getElementById("practice-summary");
  if (!week) {
    mount.innerHTML = `<h3>Practice</h3><p class="supporting-copy">No upcoming practices are listed in the published schedule.</p><a class="text-link" href="./practice-schedule.html">View season practice schedule</a>`;
    return;
  }
  const rows = (week.practices || []).map((practice) => {
    const off = practice.status === "off";
    const meaningfulNote = practice.note && !["normal", "none"].includes(practice.note.toLowerCase());
    const day = new Date(`${practice.date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: schoolTimezone, weekday: "short" });
    const dayNumber = new Date(`${practice.date}T12:00:00Z`).getUTCDate();
    return `<li${off ? ' class="practice-off"' : ""}><time datetime="${escapeHtml(practice.date)}">${escapeHtml(day)} ${dayNumber}</time><span>${escapeHtml(off ? "No practice" : practice.time)}</span><span class="practice-location">${escapeHtml(off ? "" : practice.location)}</span>${meaningfulNote ? `<span class="practice-note">${escapeHtml(practice.note)}</span>` : ""}</li>`;
  }).join("");
  mount.innerHTML = `<h3>Practice</h3><p class="practice-dates">Week of ${escapeHtml(displayDate(week.weekStart))}</p><ul class="practice-list">${rows}</ul><a class="text-link" href="./practice-schedule.html">Full practice schedule</a>`;
}

function renderUpdates(results) {
  const definitions = [
    { title: "Team records updated", description: "All-time boys’ and girls’ records.", href: "./team-records.html" },
    { title: "Practice schedule updated", description: "Practice dates and schedule notes.", href: "./practice-schedule.html" },
    { title: "Team roster updated", description: "The 2025–2026 swimmers, by team.", href: "./roster.html" },
  ];
  const updates = results.flatMap((result, index) => {
    if (result.status !== "fulfilled") return [];
    const raw = result.value.updated || result.value.lastUpdated;
    const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw || "");
    const date = parts ? `${parts[3]}-${parts[1]}-${parts[2]}` : raw;
    return date ? [{ ...definitions[index], date }] : [];
  }).sort((a, b) => b.date.localeCompare(a.date));
  if (!updates.length) return; // Keep the useful static links if metadata is unavailable.
  document.getElementById("homepage-updates").innerHTML = updates.map((update) =>
    `<li><a href="${update.href}"><time class="update-date" datetime="${escapeHtml(update.date)}">${escapeHtml(displayDate(update.date))}</time><div class="update-body"><h3>${escapeHtml(update.title)}</h3><p>${escapeHtml(update.description)}</p></div></a></li>`
  ).join("");
}

if (calendarDate !== today) {
  const notice = document.getElementById("archive-notice");
  notice.textContent = `Archived calendar · ${displayDate(calendarDate, { year: "numeric" })}`;
  notice.hidden = false;
}
document.getElementById("study-year").textContent = new Date().getFullYear();

// An inline disclosure menu needs no modal overlay or focus trap.
const menuButton = document.getElementById("study-menu-toggle");
const navigation = document.getElementById("study-navigation");
const narrowScreen = window.matchMedia("(max-width: 899px)");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.querySelector("span").textContent = "Menu";
  navigation.hidden = narrowScreen.matches;
}
function resetNavigation() {
  menuButton.hidden = !narrowScreen.matches;
  closeMenu();
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector("span").textContent = open ? "Close" : "Menu";
  navigation.hidden = !open;
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a") && narrowScreen.matches) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }
});
narrowScreen.addEventListener("change", resetNavigation);
resetNavigation();

// Navigation is ready before waiting for content requests.
const requests = [
  loadJson("./assets/data/meet-schedule.json"),
  loadJson("./assets/data/practice-schedule.json"),
  loadJson("./assets/data/records-meta.json"),
  loadJson("./assets/rosters/roster-2025-2026.json"),
];
const [meets, practices, recordsMeta, roster] = await Promise.allSettled(requests);
if (meets.status === "fulfilled") renderMeet(meets.value);
else document.getElementById("meet-summary").querySelector(".supporting-copy").textContent = "Meet details are unavailable here. Open the full schedule or contact Coach.";
if (practices.status === "fulfilled") renderPractice(practices.value);
else document.getElementById("practice-summary").querySelector(".supporting-copy").textContent = "Practice details are unavailable here. Open the full schedule or contact Coach.";
renderUpdates([recordsMeta, practices, roster]);
