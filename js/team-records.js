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
    <tr class="[&>td]:px-4 [&>td]:py-2.5 [&>td]:text-left">
      <td>${escapeHtml(r.Event)}</td>
      <td>${escapeHtml(r.RecordTime)}</td>
      <td>${escapeHtml(r.RecordHolder)}</td>
      <td>${escapeHtml(r.RecordDate)}</td>
    </tr>
  `).join("");

  girlsbodyEl.innerHTML = girlsfiltered.map(r => `
    <tr class="[&>td]:px-4 [&>td]:py-2.5 [&>td]:text-left">
      <td>${escapeHtml(r.Event)}</td>
      <td>${escapeHtml(r.RecordTime)}</td>
      <td>${escapeHtml(r.RecordHolder)}</td>
      <td>${escapeHtml(r.RecordDate)}</td>
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