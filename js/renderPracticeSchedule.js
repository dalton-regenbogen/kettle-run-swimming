function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateISOToShort(dateISO) {
  // dateISO: "YYYY-MM-DD"
  // Output example: "Nov 10"
  if (!dateISO) return "";
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function statusRowClass(status) {
  // Tailwind v4-friendly classes (no config needed)
  if (status === "off") {
    return "opacity-60 text-zinc-500 line-through";
  }
  return "";
}



function renderWeekHeaderRow(week) {
  const label = escapeHtml(week.weekLabel || "Week");
  const dateRange =
    week.weekStart && week.weekEnd
      ? `${formatDateISOToShort(week.weekStart)} – ${formatDateISOToShort(week.weekEnd)}`
      : "";

  return `
    <tr class="bg-brand border-b border-zinc-200">
      <td colspan="3" class="px-3 md:px-4 py-2.5 border-t border-zinc-200 font-semibold text-white text-sm md:text-base">
        ${label}
      </td>
    </tr>
    <tr class="bg-zinc-50">
      <td class="px-3 md:px-4 py-1 text-left text-[11px] md:text-sm font-semibold tracking-wider">Day</td>
      <td class="px-3 md:px-4 py-1 text-left text-[11px] md:text-sm font-semibold tracking-wider">Time</td>
      <td class="px-3 md:px-4 py-1 text-left text-[11px] md:text-sm font-semibold tracking-wider">Location</td>
    </tr>
  `;
}

function renderPracticeRow(practice) {
  const dayLong = escapeHtml(practice?.day?.long || "");
  const dateShort = formatDateISOToShort(practice?.date);
  const time = escapeHtml(practice?.time || "");
  const location = escapeHtml(practice?.location || "");
  const status = practice?.status || "normal";

  const rowClass = statusRowClass(status);

  return `
    <tr class="border-t border-zinc-200 text-xs md:text-sm ${rowClass}">
      <td class="px-3 md:px-4 py-2.5 align-top">
        <div class="font-medium ${status === "off" ? "text-zinc-500" : ""}">
          ${dayLong} <span class="text-zinc-500 font-normal"></span>
        </div>
        ${dateShort ? `<div class="text-[10px] md:text-xs text-zinc-500">${dateShort}</div>` : ""}
      </td>

      <td class="px-3 md:px-4 py-2.5 align-top whitespace-nowrap">${time || "—"}</td>
      <td class="px-3 md:px-4 py-2.5 align-top">${location || "—"}</td>
    </tr>
  `;
}

function renderScheduleTable(data) {
  const weeks = Array.isArray(data?.weeks) ? data.weeks : [];

  const bodyRows = weeks
    .map((week) => {
      const weekHeader = renderWeekHeaderRow(week);
      const practices = Array.isArray(week.practices) ? week.practices : [];
      const practiceRows = practices.map((p) => renderPracticeRow(p, week)).join("");
      return weekHeader + practiceRows;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div
            class="flex items-center justify-between border-b border-gray-200 bg-background-50 px-3 md:px-5 py-4"
          >
            <div class="flex items-center gap-3">
              <div class="h-9 w-1.5 rounded-full bg-brand"></div>
              <div>
                <h2
                  class="text-base md:text-lg font-bold tracking-tight text-black"
                >
                Full Season Schedule
                </h2>
                <p class="text-[11px] text-gray-700">
                  All practices <span class="hidden md:inline">for 2025-2026 season</span> are at WARF, 3:30-4:30 PM, M - TH.
                </p>
              </div>
            </div>

            <p
              id="scheduleLastUpdated"
              class="hidden md:flex rounded-md bg-gray-100 px-2 py-1 text-[10px] md:text-[11px] font-semibold text-black text-center"
            ></p>
          </div>
      <table class="min-w-full text-xs md:text-sm whitespace-nowrap">
        <thead>
          
        </thead>
        <tbody>
          ${bodyRows || `
            <tr>
              <td colspan="3" class="px-4 py-6 text-center text-zinc-500">No schedule data found.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

export async function renderPracticeSchedule(opts = {}) {
  const { jsonUrl, mount } = opts;

  const el =
    typeof mount === "string" ? document.querySelector(mount) : mount;

  if (!el) {
    console.warn("[practiceRender] mount element not found:", mount);
    return;
  }
  if (!jsonUrl) {
    el.innerHTML = `<div class="text-zinc-500">Missing jsonUrl</div>`;
    return;
  }

  try {
    const res = await fetch(jsonUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const data = await res.json();

    el.innerHTML = renderScheduleTable(data);
  } catch (err) {
    console.error("[practiceRender] error:", err);
    el.innerHTML = `
      <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        Could not load practice schedule.
        <div class="text-sm text-red-700 mt-1">${escapeHtml(err.message || String(err))}</div>
      </div>
    `;
  }
}