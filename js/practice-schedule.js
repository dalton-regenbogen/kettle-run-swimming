const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1fXkUeSWhFFWmpj8MAOt-UbaBK9WpUYqYXUBfpED9jEI/export?format=csv&gid=665607567';

// --- CSV PARSER (same as before) ---
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || '').trim();
    });
    return row;
  });
}

// --- DATE HELPERS ---
function getWeekStart(date) {
  const d = new Date(date);
  if (isNaN(d)) return null;
  const day = d.getDay(); // 0 = Sun
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day); // go back to Sunday
  return d;
}

function formatShort(date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// --- GROUP BY WEEK ---
function groupPracticesByWeek(practices) {
  const weeksMap = new Map();

  practices.forEach((p) => {
    const weekStart = getWeekStart(p.dateObj);
    if (!weekStart) return;
    const weekKey = weekStart.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, {
        weekStart,
        items: [],
      });
    }
    weeksMap.get(weekKey).items.push(p);
  });

  // Map → sorted array
  const weeks = Array.from(weeksMap.values()).sort(
    (a, b) => a.weekStart - b.weekStart
  );

  // Sort days inside each week
  weeks.forEach((week) => {
    week.items.sort((a, b) => a.dateObj - b.dateObj);
  });

  return weeks;
}

// --- RENDER WEEKS AS MINI-TABLES ---
function renderPracticeWeeks(weeks) {
  const container = document.getElementById('practice-schedule-weeks');
  if (!container) {
    console.error('Missing #practice-schedule-weeks container');
    return;
  }

  container.innerHTML = '';

  if (!weeks || weeks.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">No practices scheduled.</p>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  weeks.forEach((week) => {
    const { weekStart, items } = week;

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const section = document.createElement('section');
    section.className =
      'border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden';
    
    // Header (Week of X – Y)
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between px-4 py-2 border-b bg-green-900';

    const title = document.createElement('h2');
    title.className = 'text-sm font-semibold text-white';
    title.textContent = `Week of ${formatShort(weekStart)} – ${formatShort(
      weekEnd
    )}`;

    const badge = document.createElement('span');
    badge.className = 'text-xs text-white';
    badge.textContent = `${items.length} practice${
      items.length !== 1 ? 's' : ''
    }`;

    header.appendChild(title);
    header.appendChild(badge);

    // Table shell
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'overflow-x-auto';

    const table = document.createElement('table');
    table.className = 'min-w-full text-xs sm:text-sm';

    table.innerHTML = `
      <thead class="bg-white border-b">
        <tr class="text-left text-gray-900">
          <th class="py-2.5 px-3 font-medium">Date</th>
          <th class="py-2.5 px-3 font-medium">Day</th>
          <th class="py-2.5 px-3 font-medium hidden sm:table-cell">Time</th>
          <th class="py-2.5 px-3 font-medium hidden sm:table-cell">Location</th>
          <th class="py-2.5 px-3 font-medium sm:table-cell">Note</th>
        </tr>
      </thead>
      <tbody class="divide-y"></tbody>
    `;

    const tbody = table.querySelector('tbody');

    items.forEach((p) => {
      const tr = document.createElement('tr');

      const isCanceled =
        (p.Note && p.Note.toLowerCase().includes('canceled')) || false;

      const isNormal =
        (p.Note && p.Note.toLowerCase().includes('normal')) || false;

      const isOffDay = 
        (p.Note && p.Note.toLowerCase().includes('off day')) || false;

      const baseCell = 'py-2.5 px-3 whitespace-nowrap';
      const cancelClass = isCanceled ? ' italic line-through text-red-400' : '';
      const normalClass = isNormal ? ' text-gray-900' : '';
      const offDayClass = isOffDay ? ' italic line-through text-gray-400' : '';

      tr.innerHTML = `
        <td class="${baseCell + cancelClass + normalClass + offDayClass}">${p.Date || ''}</td>
        <td class="${baseCell + cancelClass + normalClass + offDayClass}">${p.Day || ''}</td>
        <td class="${baseCell + cancelClass + normalClass + offDayClass} hidden sm:table-cell">${p.Time || ''}</td>
        <td class="${baseCell + cancelClass + normalClass + offDayClass} hidden sm:table-cell">${p.Location || ''}</td>
        <td class="${baseCell + cancelClass + normalClass + offDayClass}">${p.Note || ''}</td>
      `;

      tbody.appendChild(tr);
    });

    tableWrapper.appendChild(table);
    section.appendChild(header);
    section.appendChild(tableWrapper);
    container.appendChild(section);
  });
}

// --- MAIN LOAD FLOW ---
async function loadPracticeSchedule() {
  const container = document.getElementById('practice-schedule-weeks');

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Normalize rows into practice objects with Date parsed
    const practices = rows
      .map((row) => {
        const dateStr = row['Date'] || row['date'];
        if (!dateStr) return null;

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj)) {
          console.warn('Could not parse date:', dateStr);
          return null;
        }

        return {
          ...row,
          Date: row['Date'], // keep original display
          dateObj,
        };
      })
      .filter(Boolean);

    const weeks = groupPracticesByWeek(practices);
    renderPracticeWeeks(weeks);
  } catch (error) {
    console.error('Error loading schedule:', error);
    if (container) {
      container.innerHTML = `
        <div class="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
          Unable to load schedule right now. Please try again later.
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', loadPracticeSchedule);