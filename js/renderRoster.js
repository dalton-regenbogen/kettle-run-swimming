let rosterData = null;
let teamFilter = "All"; // "All" | "Girls" | "Boys"

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year.slice(-2)}`;
}

function setLastUpdated(updated) {
  const text = updated ? `Last Updated: ${formatDate(updated)}` : "";
  const desktop = document.getElementById("rosterLastUpdated");
  const mobile = document.getElementById("rosterLastUpdatedMobile");
  if (desktop) desktop.textContent = text;
  if (mobile) mobile.textContent = updated ? `Updated: ${formatDate(updated)}` : "";
}

function renderRosterRows(athletes) {
  const tbody = document.getElementById("rosterBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Optional: stable sort by last name, then first
  const sorted = [...athletes].sort((a, b) => {
    const al = (a.last || "").toLowerCase();
    const bl = (b.last || "").toLowerCase();
    if (al !== bl) return al.localeCompare(bl);
    return (a.first || "").toLowerCase().localeCompare((b.first || "").toLowerCase());
  });

  const filtered =
    teamFilter === "All" ? sorted : sorted.filter(a => a.team === teamFilter);

  for (const athlete of filtered) {
    const roles = (athlete.roles || []).filter(Boolean).join(", ");
    const subtitleParts = [];
    if (athlete.team) subtitleParts.push(`${athlete.team} Team`);
    if (roles) subtitleParts.push(roles);

    const tr = document.createElement("tr");

    // Safer: build with textContent instead of injecting HTML
    const tdAvatar = document.createElement("td");
    tdAvatar.className = "px-3 md:px-4 py-2.5 text-xs font-semibold";
    const avatar = document.createElement("span");
    avatar.className =
      "bg-brand w-9 h-9 rounded-full text-white text-xs font-semibold flex items-center justify-center";
    avatar.textContent = `${(athlete.first || "?")[0]}${(athlete.last || "?")[0]}`.toUpperCase();
    tdAvatar.appendChild(avatar);

    const tdName = document.createElement("td");
    tdName.className = "px-3 md:px-4 py-2.5";
    const nameLine = document.createElement("div");
    nameLine.className = "font-medium";
    nameLine.textContent = `${athlete.first || ""} ${athlete.last || ""}`.trim();

    const subLine = document.createElement("div");
    subLine.className = "text-xs font-medium text-gray-500";
    subLine.textContent = subtitleParts.join(" • ");

    tdName.appendChild(nameLine);
    tdName.appendChild(subLine);

    const tdYear = document.createElement("td");
    tdYear.className = "px-3 md:px-4 py-2.5";
    tdYear.textContent = athlete.yearOnTeam || "";

    const tdClass = document.createElement("td");
    tdClass.className = "px-3 md:px-4 py-2.5";
    tdClass.textContent = athlete.class || "";

    const tdStroke = document.createElement("td");
    tdStroke.className = "px-3 md:px-4 py-2.5";
    tdStroke.textContent = athlete.stroke || "";

    tr.append(tdAvatar, tdName, tdYear, tdClass, tdStroke);
    tbody.appendChild(tr);
  }
}

async function loadSeason(file) {
  rosterData = await fetchJson(`./assets/rosters/${file}`);
  setLastUpdated(rosterData.updated);
  renderRosterRows(rosterData.athletes || []);
  setSeasonLabel(rosterData.season);
}

function setSeasonLabel(season) {
  const el = document.getElementById("rosterSeasonLabel");
  if (!el) return;
  el.textContent = season ? `(${season})` : "";
}


async function initRoster() {
  try {
    const index = await fetchJson("./assets/rosters/roster-index.json");

    const seasonSelect = document.getElementById("seasonSelect");
    if (seasonSelect) {
      seasonSelect.innerHTML = "";
      for (const s of index.seasons || []) {
        const opt = document.createElement("option");
        opt.value = s.file;
        opt.textContent = s.label;
        seasonSelect.appendChild(opt);
      }

      seasonSelect.addEventListener("change", () => loadSeason(seasonSelect.value));
      // default to first season
      if (seasonSelect.value) await loadSeason(seasonSelect.value);
      else if (index.seasons?.[0]) await loadSeason(index.seasons[0].file);
    } else {
      // fallback: your current hardcoded file
      await loadSeason("roster-2025-2026.json");
    }

    // Wire up All/Boys/Girls filter buttons
      const filterButtons = Array.from(document.querySelectorAll(".roster-filter-btn"));

      function setActiveFilter(next) {
        teamFilter = next;

        for (const btn of filterButtons) {
          const isActive = btn.dataset.value === next;
          btn.setAttribute("aria-pressed", String(isActive));

          // active styling (tweak to taste)
          btn.classList.toggle("bg-white", isActive);
          btn.classList.toggle("shadow-sm", isActive);
          btn.classList.toggle("text-black", isActive);

          // inactive styling
          btn.classList.toggle("text-black/70", !isActive);
        }

        renderRosterRows(rosterData?.athletes || []);
      }

      for (const btn of filterButtons) {
        btn.addEventListener("click", () => setActiveFilter(btn.dataset.value));
      }

      // Ensure default visual state matches default filter
      setActiveFilter(teamFilter);


    // Example: if you add filter buttons, just set teamFilter then re-render:
    // document.getElementById("filterGirls").addEventListener("click", () => { teamFilter="Girls"; renderRosterRows(rosterData.athletes); });

  } catch (err) {
    console.error("Error loading roster:", err);
  }
}

initRoster();