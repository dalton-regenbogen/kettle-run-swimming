let allRecords = [];
let currentSortKey = "Event";

const boysbodyEl = document.getElementById("boysRecordsBody");
const girlsbodyEl = document.getElementById("girlsRecordsBody");

const boysgenderFilterEl = document.getElementById("boysgenderFilter");
const girlsgenderFilterEl = document.getElementById("girlsgenderFilter");

async function loadRecords() {
  const res = await fetch("./assets/data/records.json");
  if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);
  allRecords = await res.json();
  render();
}

function render() {
  //const gender = genderFilterEl.value;
  const boysgender = "Male";
  const girlsgender = "Female";


  let boysfiltered = allRecords.filter(r => {
    const matchesBoysGender = r.Gender === boysgender;
    return matchesBoysGender;
  });

  let girlsfiltered = allRecords.filter(r => {
    const matchesGirlsGender = r.Gender === girlsgender;
    return matchesGirlsGender;
  });

  boysbodyEl.innerHTML = boysfiltered.map(r => `
  <tr class="block md:table-row border-b border-gray-200 last:border-b-0 bg-white md:border-0 md:bg-transparent [&>td]:px-3 md:[&>td]:px-4 [&>td]:py-2.5 [&>td]:text-left">
    <td class="block md:table-cell">
      <!-- Mobile stacked layout -->
      <div class="md:hidden">
        <div class="flex items-start justify-between gap-3">
          <div class="font-semibold text-sm text-black leading-snug">${escapeHtml(r.Event)}</div>
          <div class="text-sm font-semibold tabular-nums text-black">${escapeHtml(r.RecordTime)}</div>
        </div>
        <div class="mt-1 text-[11px] text-gray-700 leading-snug wrap-break-word">${escapeHtml(r.RecordHolder)}</div>
        <div class="mt-1 text-[11px] text-gray-500">${escapeHtml(r.RecordDate)}</div>
      </div>

      <!-- Desktop normal cell -->
      <div class="hidden md:block">${escapeHtml(r.Event)}</div>
    </td>

    <!-- Desktop-only columns -->
    <td class="hidden md:table-cell">${escapeHtml(r.RecordTime)}</td>
    <td class="hidden md:table-cell">${escapeHtml(r.RecordHolder)}</td>
    <td class="hidden md:table-cell">${escapeHtml(r.RecordDate)}</td>
  </tr>
`).join("");


  girlsbodyEl.innerHTML = girlsfiltered.map(r => `
    <tr class="block md:table-row border-b border-gray-200 last:border-b-0 bg-white md:border-0 md:bg-transparent [&>td]:px-3 md:[&>td]:px-4 [&>td]:py-2.5 [&>td]:text-left">
    <td class="block md:table-cell">
      <!-- Mobile stacked layout -->
      <div class="md:hidden">
        <div class="flex items-start justify-between gap-3">
          <div class="font-semibold text-sm text-black leading-snug">${escapeHtml(r.Event)}</div>
          <div class="text-sm font-semibold tabular-nums text-black">${escapeHtml(r.RecordTime)}</div>
        </div>
        <div class="mt-1 text-[11px] text-gray-700 leading-snug wrap-break-word">${escapeHtml(r.RecordHolder)}</div>
        <div class="mt-1 text-[11px] text-gray-500">${escapeHtml(r.RecordDate)}</div>
      </div>

      <!-- Desktop normal cell -->
      <div class="hidden md:block">${escapeHtml(r.Event)}</div>
    </td>

    <!-- Desktop-only columns -->
    <td class="hidden md:table-cell">${escapeHtml(r.RecordTime)}</td>
    <td class="hidden md:table-cell">${escapeHtml(r.RecordHolder)}</td>
    <td class="hidden md:table-cell">${escapeHtml(r.RecordDate)}</td>
  </tr>
`).join("");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Start
loadRecords().catch(err => {
  boysbodyEl.innerHTML = `<tr><td colspan="4">Error: ${escapeHtml(err.message)}</td></tr>`;
  girlsbodyEl.innerHTML = `<tr><td colspan="4">Error: ${escapeHtml(err.message)}</td></tr>`;
});