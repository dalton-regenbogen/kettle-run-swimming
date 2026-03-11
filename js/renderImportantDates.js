function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMonthDay(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`); // local midnight
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate());
  return { month, day };
}


function buildDateItem( { month, day, name, details }) {
  return `
    <li class="group flex items-start gap-3 p-4 hover:bg-white/70">
      <!-- Date badge -->
      <div class="flex w-16 shrink-0 flex-col items-center rounded-xl border border-gray-200 bg-white px-2 py-2 text-center">
        <span class="text-[10px] font-extrabold uppercase tracking-wide text-gray-600">${escapeHtml(month)}</span>
        <span class="text-lg font-extrabold leading-5 text-gray-900">${escapeHtml(day)}</span>
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-extrabold text-gray-900">${escapeHtml(name)}</p>
        <p class="mt-1 text-xs text-gray-700">${escapeHtml(details)}</p>
      </div>
    </li>
  `;
}

async function renderImportantDates({
  jsonPath = "./assets/data/importantDates.json",
  listId = "importantDates",
  seasonLabelSelector = "[data-season-label]",
  titleSelector = "[data-season-title]"
} = {}) {
  const listEl = document.getElementById(listId);
  if (!listEl) return;

  try {
    const res = await fetch(jsonPath, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to fetch ${jsonPath} (${res.status})`);
    const data = await res.json();

    const seasonLabelEl = document.querySelector(seasonLabelSelector);
    const titleEl = document.querySelector(titleSelector);
    if (seasonLabelEl && data.seasonLabel) seasonLabelEl.textContent = data.seasonLabel;
    if (titleEl && data.title) titleEl.textContent = data.title;
    
    const items = Array.isArray(data.items) ? data.items.slice() : [];

    items.sort((a,b) => (a.date || "").localeCompare(b.date || ""));

    listEl.innerHTML = items.map((item) => {
      const { month, day } = formatMonthDay(item.date);
      return buildDateItem({
        month,
        day,
        name: item.name || "",
        details: item.details || ""
      });
    }).join("");
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<li class="p-4 text-sm text-gray-700">Unable to load important dates right now.</li>`;
  }
}

renderImportantDates();
