const ROSTER_CSV_URL = 'https://docs.google.com/spreadsheets/d/1fXkUeSWhFFWmpj8MAOt-UbaBK9WpUYqYXUBfpED9jEI/export?format=csv&gid=2080002826';

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

// 3. Convert raw CSV rows into a clean "roster" object shape
function normalizeRosterRows(rows) {
  return rows
    .filter((row) => {
      // Optional: skip rows that are clearly empty
      const first = row['First Name'];
      const last = row['Last Name'];
      return first || last;
    })
    .map((row) => {
      const firstName = row['First Name'] || '';
      const lastName = row['Last Name'] || '';
      const team = row['Team'] || ''; // Expect: "Girls" or "Boys"
      const captain = row['Captain'] || ''; // e.g. "Captain" or ""
      const classYear = row['Class'] || ''; // e.g. "Fr.", "So.", etc.
      const yearsOnTeam = row['Years on Team'] || ''; // e.g. "1st", "2nd"
      const stroke = row['Stroke'] || ''; // e.g. "Yes" or ""
      const activeRaw = row['Active'] || ''; // e.g. "Yes" or ""

      return {
        firstName,
        lastName,
        team,
        captain,
        classYear,
        yearsOnTeam,
        stroke,
        isActive:
          activeRaw === '' || activeRaw.toLowerCase() === 'yes', // treat blank as active
      };
    });
}

let fullRoster = []; // will hold all normalized roster rows
let currentFilter = 'All';

// Sorting state
const sortState = {
  column: null, // 'name' | 'classYear' | 'yearsOnTeam'
  direction: 'asc', // 'asc' | 'desc'
};

function getFilteredRoster(filter) {
  if (!fullRoster || fullRoster.length === 0) return [];

  const normalizedFilter = (filter || 'All').toLowerCase();

  // "All" → just return everyone (renderRosterTable already skips inactive)
  if (normalizedFilter === 'all') {
    return fullRoster;
  }

  // Boys / Girls → filter by team
  return fullRoster.filter((athlete) => {
    const team = (athlete.team || '').toLowerCase();
    return team === normalizedFilter;
  });
}

function sortRoster(rows) {
  if (!sortState.column) return rows;

  const sorted = [...rows];

  sorted.sort((a, b) => {
    let aVal;
    let bVal;

    switch (sortState.column) {
      case 'name': {
        const aName = `${a.lastName || ''} ${a.firstName || ''}`.trim().toLowerCase();
        const bName = `${b.lastName || ''} ${b.firstName || ''}`.trim().toLowerCase();
        aVal = aName;
        bVal = bName;
        break;
      }
      case 'stroke': {
        const order = ['Free', 'Fly', 'IM', 'Back', 'Breast'];
        const indexOrEnd = (val) => {
          const idx = order.indexOf(val);
          return idx === -1 ? order.length : idx;
        };
        aVal = indexOrEnd(a.stroke);
        bVal = indexOrEnd(b.stroke);
        break;
      }
      case 'classYear': {
        const order = ['Fr.', 'So.', 'Jr.', 'Sr.'];
        const indexOrEnd = (val) => {
          const idx = order.indexOf(val);
          return idx === -1 ? order.length : idx;
        };
        aVal = indexOrEnd(a.classYear);
        bVal = indexOrEnd(b.classYear);
        break;
      }
      case 'yearsOnTeam': {
        const parseYears = (val) => {
          // Expect "1st", "2nd", "3rd", "4th" -> map to 1–4
          const n = parseInt(val, 10);
          return Number.isNaN(n) ? 0 : n;
        };
        aVal = parseYears(a.yearsOnTeam);
        bVal = parseYears(b.yearsOnTeam);
        break;
      }
      default:
        return 0;
    }

    if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

function updateSortIndicators() {
  const headers = document.querySelectorAll('th.sortable');

  headers.forEach((th) => {
    const key = th.dataset.sortKey;
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;

    // Not the active column → hide arrow
    if (sortState.column !== key) {
      arrow.textContent = '▲';
      arrow.classList.add('opacity-0');
      return;
    }

    // Active column → show arrow and point correct direction
    arrow.classList.remove('opacity-0');
    arrow.textContent = sortState.direction === 'asc' ? '▲' : '▼';
  });
}


function applyFiltersAndSort() {
  const filtered = getFilteredRoster(currentFilter);
  const sorted = sortRoster(filtered);
  renderRosterTable(sorted);
}


function updateFilterButtons(activeFilter) {
  const buttons = document.querySelectorAll('.roster-filter-btn');
  if (!buttons.length) return;

  const normalizedActive = (activeFilter || 'All').toLowerCase();

  buttons.forEach((btn) => {
    const value = (btn.dataset.value || 'All').toLowerCase();
    const isActive = value === normalizedActive;

    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    // Base styles are already in the HTML class attribute.
    // Here we just add/remove "active" styling.
    btn.classList.toggle('bg-white', isActive);
    btn.classList.toggle('shadow', isActive);
    btn.classList.toggle('text-gray-900', isActive);
    btn.classList.toggle('text-gray-500', !isActive);
  });
}

function setupRosterFilterButtons() {
  const buttons = document.querySelectorAll('.roster-filter-btn');
  if (!buttons.length) {
    console.warn('No .roster-filter-btn elements found');
    return;
  }

  // Set initial visual state
  updateFilterButtons(currentFilter);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const newFilter = button.dataset.value || 'All';

      // If the filter didn't change, no need to re-render
      if (newFilter === currentFilter) return;

      currentFilter = newFilter;

      // Update button highlights
      updateFilterButtons(currentFilter);

      applyFiltersAndSort();
    });
  });
}

function setupHeaderSorting() {
  const sortableHeaders = document.querySelectorAll('th.sortable');
  if (!sortableHeaders.length) {
    console.warn('No sortable headers found');
    return;
  }

  sortableHeaders.forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if (!key) return;

      if (sortState.column === key) {
        // Toggle direction
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // Switch to a new column, default to ascending
        sortState.column = key;
        sortState.direction = 'asc';
      }

      applyFiltersAndSort();

      updateSortIndicators();
    });
  });
}

function getInitials(firstName, lastName) {
  const firstInitial = firstName?.trim().charAt(0) || '';
  const lastInitial = lastName?.trim().charAt(0) || '';
  return (firstInitial + lastInitial).toUpperCase();
}

function renderRosterTable(rosterRows) {
  const tbody = document.getElementById('roster-table-body');
  if (!tbody) {
    console.warn('No #roster-table-body found in DOM');
    return;
  }

  // Clear any existing rows
  tbody.innerHTML = '';

  // If nothing to show, you could render an "empty" state
  if (!rosterRows || rosterRows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'px-4 py-6 text-center text-sm text-gray-500';
    td.textContent = 'No roster data available.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rosterRows.forEach((athlete) => {
    if (!athlete.isActive) return; // skip inactive rows

    const {
      firstName,
      lastName,
      team,
      captain,
      classYear,
      yearsOnTeam,
      stroke,
    } = athlete;

    const initials = getInitials(firstName, lastName);
    const fullName = `${firstName} ${lastName}`.trim();

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';

    // 1) Icon / initials
    const iconTd = document.createElement('td');
    iconTd.className = 'px-1 py-3';
    const iconDiv = document.createElement('div');
    iconDiv.className =
      'mx-auto h-9 w-9 rounded-full bg-green-900 text-white flex items-center justify-center text-xs font-semibold';
    iconDiv.textContent = initials || '?';
    iconTd.appendChild(iconDiv);

    // 2) Athlete name + team label + captain label
    const nameTd = document.createElement('td');
    nameTd.className = 'px-2 py-3';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'font-medium text-gray-900';
    nameDiv.textContent = fullName || '(No name)';

    const teamDiv = document.createElement('div');
    teamDiv.className = 'text-xs text-gray-500';
    teamDiv.textContent = team ? `${team} Team` : '';

    const captainDiv = document.createElement('div');
    captainDiv.className = 'text-xs font-medium text-orange-600';
    captainDiv.textContent = captain ? `${captain}` : '';

    nameTd.appendChild(nameDiv);
    nameTd.appendChild(captainDiv);
    nameTd.appendChild(teamDiv);
    

    // 3) Stroke column
    const strokeTd = document.createElement('td');
    strokeTd.className = 'px-2 py-3 text-gray-700';
    strokeTd.textContent = stroke || '';

    // 4) Class
    const classTd = document.createElement('td');
    classTd.className = 'px-2 py-3 text-gray-700';
    classTd.textContent = classYear || '';

    // 5) Years on Team
    const yearsTd = document.createElement('td');
    yearsTd.className = 'hidden md:table-cell md:px-2 md:py-3 md:text-gray-700';
    yearsTd.textContent = yearsOnTeam || '';

    // Append all cells to the row
    tr.appendChild(iconTd);
    tr.appendChild(nameTd);
    tr.appendChild(strokeTd);
    tr.appendChild(classTd);
    tr.appendChild(yearsTd);

    // Add row to tbody
    tbody.appendChild(tr);
  });
}

// 4. Load roster data from Google Sheets
async function loadRosterData() {
  try {
    const response = await fetch(ROSTER_CSV_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const csvText = await response.text();
    const rawRows = parseCSV(csvText);
    const roster = normalizeRosterRows(rawRows);

    console.log('Raw CSV rows:', rawRows);
    console.log('Normalized roster:', roster);

    fullRoster = roster;
    renderRosterTable(fullRoster);

    currentFilter = 'All';
    const initial = getFilteredRoster(currentFilter);
    renderRosterTable(initial);
    
    sortState.column = null;
    sortState.direction = 'asc';

    applyFiltersAndSort();
    updateSortIndicators();
    setupRosterFilterButtons();
    setupHeaderSorting();

    return roster;
  } catch (error) {
    console.error('Error loading roster:', error);
    return [];
  }
}

// 5. Kick it off when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadRosterData();
});
