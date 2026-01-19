const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1fXkUeSWhFFWmpj8MAOt-UbaBK9WpUYqYXUBfpED9jEI/export?format=csv&gid=0';

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || "").trim();
    });
    return row;
  });
}

function renderSchedule(rows) {
  const tbody = document.getElementById("schedule-body");
  tbody.innerHTML = "";

  rows.forEach((meet, index) => {
    const isLast = index === rows.length -1;

    const tr = document.createElement("tr");
    tr.className = "border-t border-gray-200" + (isLast ? "" : " border-b");

    tr.innerHTML = `
      <td class="py-3 md:px-4 px-2 md:text-sm text-xs text-left whitespace-nowrap ${isLast ? "rounded-bl-lg" : ""}"> ${meet["Date"] || ""}</td>
      <td class="py-3 md:px-4 px-2 md:text-sm text-left whitespace-nowrap hidden sm:inline-block">${meet["Format"] || ""}</td>
      <td class="py-3 md:px-4 px-2 md:text-sm text-xs text-left whitespace-nowrap">${meet["Opponent"] || ""}</td>
      <td class="py-3 md:px-4 px-2 md:text-sm text-left whitespace-nowrap hidden sm:inline-block">${meet["Home/Away"] || ""}</td>
      <td class="py-3 md:px-4 px-2 md:text-sm text-xs text-left whitespace-nowrap ${isLast ? "rounded-br-lg" : ""}">${meet["Location"] || ""}</td>
    `;

    tbody.appendChild(tr);
    
  });

}

async function loadSchedule() {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    renderSchedule(rows);
  } catch (error) {
    console.error("Error loading schedule:", error);
    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-4 text-red-400 text-center">
          Unable to load schedule right now. Please try again later.
        </td>
      </tr>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadSchedule);
