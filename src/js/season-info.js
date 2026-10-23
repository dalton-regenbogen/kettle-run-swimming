// Fills in this season's details from assets/data/season.json on the Join, Resources, and About pages.
//
// The page marks where things go:
//   <ul data-forms>                      → one row per required form (name, note, link)
//   <a data-link="apparelStore">…</a>    → gets its href from "links"; with no link yet it becomes
//                                          gray "(link coming soon)" text, or disappears if it also
//                                          has data-hide-if-empty (used for the handbook PDF)
//   [data-interest-meeting]              → "Fri, Oct 24 · Health Room 10:30 AM", from importantDates.json
//
// An empty "" in season.json means "not ready yet", so the page never shows a broken link.

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

const toDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function todayISO() {
  const override = new URLSearchParams(location.search).get("date");
  if (/^\d{4}-\d{2}-\d{2}$/.test(override ?? "")) return override;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// A link that opens in a new tab, with a hidden note for screen readers.
function externalLink(href, text, className) {
  const link = el("a", className, text);
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer"; // the new tab gets no access back to this page
  link.append(el("span", "sr-only", " (opens in a new tab)"));
  return link;
}

// One row per form: a small document icon, the name over its note, and an "Open form ↗" link.
function showForms(forms) {
  for (const list of document.querySelectorAll("[data-forms]")) {
    list.replaceChildren(
      ...forms.map((form) => {
        const row = el("li", "flex items-center gap-3 py-3");
        const icon = el("span", "grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent");
        icon.innerHTML = '<svg class="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 2.5h5.5L15 6v11.5H6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5V6.5h4M8.5 10h4M8.5 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        const text = el("div", "min-w-0 flex-1");
        text.append(el("p", "text-[12px] font-semibold md:text-[13px]", form.name));
        if (form.note) text.append(el("p", "type-small text-fg-subtle", form.note));
        const action = form.url
          ? externalLink(form.url, "Open form ↗", "type-small shrink-0 font-medium text-accent underline-offset-2 hover:underline")
          : el("span", "type-small shrink-0 text-fg-subtle", "Link coming soon");
        row.append(icon, text, action);
        return row;
      }),
    );
  }
}

// <a data-link="…"> placeholders: real link, "coming soon", or hidden.
function showLinks(links) {
  for (const link of document.querySelectorAll("a[data-link]")) {
    const url = links[link.dataset.link];
    if (url) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.append(el("span", "sr-only", " (opens in a new tab)"));
    } else if (link.hasAttribute("data-hide-if-empty")) {
      link.hidden = true;
    } else {
      // Keep the words, drop the link: "Team apparel store (link coming soon)"
      const text = el("span", "text-fg-subtle", `${link.textContent.replace(/\s*[→↗]\s*$/, "")} (link coming soon)`);
      link.replaceWith(text);
    }
  }
}

// The next interest meeting, from importantDates.json (a team event with "interest" in its name).
function showInterestMeeting(items) {
  const today = todayISO();
  const meeting = items.find((item) => /interest/i.test(item.name) && item.date >= today);
  for (const spot of document.querySelectorAll("[data-interest-meeting]")) {
    spot.textContent = meeting
      ? `${toDate(meeting.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${meeting.details.replace(/\.$/, "")}`
      : "Announced each fall, in October";
  }
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json();
}

async function loadSeasonInfo() {
  try {
    const [season, dates] = await Promise.all([
      fetchJson("./assets/data/season.json"),
      fetchJson("./assets/data/importantDates.json").catch(() => ({ items: [] })),
    ]);
    showForms(season.forms ?? []);
    showLinks(season.links ?? {});
    showInterestMeeting(dates.items ?? []);
  } catch (error) {
    console.error("Could not load season details:", error);
  }
}

loadSeasonInfo();
