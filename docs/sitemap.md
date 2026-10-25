# Sitemap and page purposes

Decisions from design step 1 (page purpose). Updated as decisions change.

## Audiences

| Audience | When | What they need most |
| --- | --- | --- |
| Current swimmers & parents | In season (Nov–Feb) | Next meet date/time/place, this week's practices, changes, results |
| Prospective swimmers & parents | Preseason (Sep–Nov) | How to join, interest meeting, required forms, commitment, coach contact |
| Fans, alumni, family | Any time | Results, records, roster |
| Coach (site owner) | Any time | Pages that are quick to update and hard to get out of date |

## Navigation

```
About · Join · Practices · Meets   [KR logo → Home]   Roster · Results · Records · Resources
```

Eight flat links, four on each side of a centered logo, no dropdowns; the phone menu lists the same eight. Left side:
getting to know and joining the team, then the schedules. Right side: the team and its results. Resources is also linked from the footer.

Meets and Practices stay separate pages ("Meet Schedule", "Practice Schedule"). A combined Schedule page with a
Meets | Practice switch and a six-link nav was tried and dropped: six links looked too spread out, and the switch
felt out of place on desktop. A full Mon–Sun calendar was also set aside (cramped on phones, mostly empty columns).

## Pages

| Page | Purpose | Status |
| --- | --- | --- |
| Home | Hero with welcome text and photo carousel; a "Right now" card that shifts by date (preseason: Join the team; in season: next meet, this week's practices, latest result; offseason: season recap); important dates; contact. | Built (`index.html`) |
| Meets | When and where each meet is, with start time, venue, opponents, status (e.g. canceled); next meet highlighted in season. | Built (`competition-schedule.html`) |
| Practice | Standard schedule (days, time, location) plus a week-by-day grid with days off; current week highlighted in season. | Built (`practice-schedule.html`) |
| Results | Season summary (dual record, win %, streak, postseason places), dual-meet scores by opponent, championship places with full standings, PDF links; season picker. Shares the season files in `src/assets/meets/` with Meets. | Built (`results.html`; `2025-2026-results.html` forwards here) |
| Roster | Team members by season, with All/Boys/Girls filter and season picker. No PDF. | Built |
| Records | All-time team bests. Web page only — no PDF download. | Built |
| Join | For prospective families (Sep–Nov). How joining works (first week of practice is the evaluation), steps and timeline, the 4 required forms, two ways to be on the team (VHSL-primary vs. USA Swimming), high school vs. summer league vs. club, costs and gear, practice basics, FAQ. | Built — first draft (`join.html`) |
| About | For anyone. Our program (story + quick facts), what we value, coaches, recent highlights, get involved (Join, Volunteer, Email). Placeholders in [brackets] for the coach bio and assistant coach. | Built — first draft (`about.html`) |
| Resources | For current families. One page with in-page sections: Swim meets 101 (how our meets are scored, order of events, entry limits, what to bring, postseason + state qualifying times), Volunteering & officiating, Team policies (attendance, lettering, conduct), Forms & eligibility, Apparel & gear, Fundraiser. Big sections can split into their own pages later. | Built — first draft (`resources.html`) |
| 404 | "Page not found" with links back to main pages. | Built (`src/pages/404.html`) |

## Content decisions (Join, About, Resources)

- Source: the season handbook, rewritten as web pages. No handbook PDF unless the coach adds one later
  (optional link in the season settings file).
- Privacy: email only (no phone number); volunteer roles listed without parents' names.
- The four required forms (VHSL Physical, FCPS Acknowledgement, FCPS Concussion, Swim Team Contact Form) are
  links to where they live, set in `src/assets/data/season.json`.
- Season-specific details (form links, store, fundraiser, qualifying times, officials info, handbook PDF) live in
  `src/assets/data/season.json`. An empty link shows "coming soon" (or hides, for the handbook PDF).

## Removed / deferred

| Item | Decision |
| --- | --- |
| News page | Removed. No replacement for now. `news.html` forwards to the home page. |
| Notice bar for urgent updates | Not now; revisit if needed. |
| Past Seasons page | Not needed; season pickers cover archives. |
| Records PDF and PDF importer script | Removed; `records.json` becomes the single source of truth. |
| Roster / schedule PDF buttons | Removed (they never linked anywhere). |
| Top 10 all-time | Deferred — no data source yet; explore later. Remove the dead nav link now. |

## Open

