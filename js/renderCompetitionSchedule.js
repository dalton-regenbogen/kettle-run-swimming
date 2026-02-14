async function loadCompetitionSchedule() {
  try {
    const response = await fetch("./assets/data/meet-schedule.json");
    const data = await response.json();

    const tbody = document.getElementById("competitionScheduleBody");
    const lastUpdatedEl = document.getElementById("scheduleLastUpdatedMobile");

    // Clear loading row
    tbody.innerHTML = "";

  function renderOpponents(opponents) {
    // opponents = [{short, full}, ...]
    return opponents
      .map((o) => {
        const safeShort = escapeHtml(o.short ?? "");
        const safeFull = escapeHtml(o.full ?? "");
        return `
          <span class="relative inline-block group cursor-auto">
            <span class="">
              ${safeShort}
            </span>
            <span
              class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                    hidden group-hover:block whitespace-nowrap
                    rounded-md bg-white px-2 py-1 text-xs text-black shadow-lg z-50"
            >
              ${safeFull}
            </span>
          </span>
        `;
      })
      .join(`<span class="text-black">, </span>`);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  data.meets.forEach((meet) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="px-3 md:px-4 py-2.5">
        ${formatDate(meet.date)}
      </td>
      <td class="hidden md:table-cell px-3 md:px-4 py-2.5">
        ${meet.type}
      </td>
      <td class="px-3 md:px-4 py-2.5">
        <span>${renderOpponents(meet.opponents || [])}</span>
      </td>
      <td class="hidden md:table-cell px-3 md:px-4 py-2.5">
        ${meet.homeAway}
      </td>
      <td class="px-3 md:px-4 py-2.5">
        ${meet.location}
      </td>
    `;

    tbody.appendChild(row);
  });

  // Last updated display
  if (data.updated && lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last Updated: ${formatDate(data.updated)}`;
  }

  } catch (error) {
  console.error("Error loading competition schedule:", error);
  }
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year}`;
}

loadCompetitionSchedule();
