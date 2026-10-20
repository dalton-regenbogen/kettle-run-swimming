// Fills in the Team Records page from assets/data/records.json.
//
// Expects these elements on the page:
//   #boys-records, #girls-records   <tbody> for each table
//   #records-updated                the "Last updated …" label

// records.json stores dates like "7-Feb-26".
function parseRecordDate(value) {
  const [day, month, year] = value.split("-");
  return new Date(`${month} ${day}, 20${year}`);
}

// records-meta.json stores dates like "2026-02-26".
function parseMetaDate(value) {
  const [year, month, day] = value.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Creates an element with classes and text. Using textContent (not innerHTML)
// means data can never be mistaken for HTML.
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

// The small yellow badge (e.g. "Class 3 State Record"), or null if there isn't one.
// The text comes straight from RecordBadge in records.json.
function badge(record) {
  if (!record.RecordBadge) return null;
  return el("span", "shrink-0 rounded-sm bg-badge px-1 py-0.5 text-[9px] leading-none font-semibold text-badge-fg md:text-[10px]", record.RecordBadge);
}

// Puts a badge after some content, when there is one.
function withBadge(content, record, className) {
  const wrapper = el("span", className);
  wrapper.append(content);
  const tag = badge(record);
  if (tag) wrapper.append(tag);
  return wrapper;
}

// Each row has two layouts:
//   phones  → one cell showing two lines: event + time, then holder (+ badge) + date
//   desktop → four normal table cells, badge next to the time
// md:hidden / hidden md:… classes show the right one for the screen size.
// Keep one display class per element: `hidden md:table-cell`, never `flex hidden`.
function recordRow(record) {
  const date = formatDate(parseRecordDate(record.RecordDate));
  const row = el("tr", "block border-b border-line last:border-0 md:table-row md:border-0 md:even:bg-fg/[0.03]");

  // First cell: the whole phone layout, or just the event name on desktop
  const first = el("td", "block px-4 py-2.5 md:table-cell");
  const phone = el("div", "md:hidden");
  const top = el("div", "flex items-start justify-between gap-3 text-[12px]"); // a touch smaller than desktop's 13px
  top.append(el("span", "font-semibold", record.Event), el("span", "font-medium", record.RecordTime));
  const bottom = el("div", "type-small mt-0.5 flex items-start justify-between gap-3");
  bottom.append(
    withBadge(el("span", "text-fg-muted", record.RecordHolder), record, "flex flex-wrap items-center gap-1.5"),
    el("span", "shrink-0 text-fg-subtle", date),
  );
  phone.append(top, bottom);
  first.append(phone, el("span", "hidden md:inline", record.Event));

  const time = el("td", "hidden px-4 py-2.5 md:table-cell");
  time.append(withBadge(el("span", "font-medium", record.RecordTime), record, "inline-flex items-center gap-1.5"));

  row.append(
    first,
    time,
    el("td", "hidden px-4 py-2.5 md:table-cell", record.RecordHolder),
    el("td", "hidden px-4 py-2.5 text-fg-muted md:table-cell", date),
  );
  return row;
}

// A slim label row, e.g. "Relays", between groups of events.
function dividerRow(label) {
  const row = el("tr", "block md:table-row");
  const cell = el("td", "type-label block border-y border-line bg-fg/[0.04] px-4 py-1.5 text-fg-subtle md:table-cell", label);
  cell.colSpan = 4;
  row.append(cell);
  return row;
}

// All rows for one team: individual events, then a "Relays" divider, then relays.
function teamRows(records) {
  const rows = [];
  let shownRelayDivider = false;
  for (const record of records) {
    if (record.Event.includes("Relay") && !shownRelayDivider) {
      rows.push(dividerRow("Relays"));
      shownRelayDivider = true;
    }
    rows.push(recordRow(record));
  }
  return rows;
}

function showMessage(tbody, message) {
  const row = el("tr");
  const cell = el("td", "px-4 py-3 text-fg-subtle", message);
  cell.colSpan = 4;
  row.append(cell);
  tbody.replaceChildren(row);
}

async function loadRecords() {
  const boys = document.getElementById("boys-records");
  const girls = document.getElementById("girls-records");

  try {
    const response = await fetch("./assets/data/records.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const records = await response.json();

    boys.replaceChildren(...teamRows(records.filter((r) => r.Gender === "Male")));
    girls.replaceChildren(...teamRows(records.filter((r) => r.Gender === "Female")));
  } catch (error) {
    console.error("Could not load records:", error);
    showMessage(boys, "Records couldn't be loaded. Please try refreshing the page.");
    showMessage(girls, "Records couldn't be loaded. Please try refreshing the page.");
  }
}

async function loadUpdatedDate() {
  const target = document.getElementById("records-updated");
  try {
    const response = await fetch("./assets/data/records-meta.json");
    if (!response.ok) return;
    const meta = await response.json();
    if (meta.lastUpdated) target.textContent = `Last updated ${formatDate(parseMetaDate(meta.lastUpdated))}`;
  } catch {
    // The date is a nice-to-have; leave it hidden if it can't load.
  }
}

loadRecords();
loadUpdatedDate();
