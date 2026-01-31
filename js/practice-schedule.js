// Opens the current week based on today's date (local time),
// closes all others, and optionally scrolls into view.
(function () {
  const weeks = Array.from(document.querySelectorAll("details[data-week-start]"));
  if (!weeks.length) return;

  // Close all weeks first
  weeks.forEach((w) => w.removeAttribute("open"));

  // Build "today" as a date at midnight to avoid time-of-day edge cases
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parse yyyy-mm-dd as local date (not UTC) to avoid timezone shifting
  function parseLocalISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // Find the latest week-start that is <= today
  let current = null;
  for (const w of weeks) {
    const startISO = w.getAttribute("data-week-start");
    const start = parseLocalISODate(startISO);
    if (start <= today) {
      if (!current) current = w;
      else {
        const currentStart = parseLocalISODate(current.getAttribute("data-week-start"));
        if (start > currentStart) current = w;
      }
    }
  }

  // If today is before the first week-start, open the first week
  if (!current) current = weeks[0];

  // Open the chosen week
  current.setAttribute("open", "");

  // Optional: scroll to it (comment out if you don't want auto-scroll)
  // current.scrollIntoView({ behavior: "smooth", block: "start" });
})();