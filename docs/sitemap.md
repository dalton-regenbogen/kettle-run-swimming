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
| Join | Interest meeting, tryouts, requirements, forms, commitment, coach contact. | Decided — content to be written by coach. Own page recommended; becomes a section of About if content is short. |
| About | Program description, coaches/staff, contact. Links to Resources. | Decided — keep |
| Resources | Team handbook, state qualifying times, and how to become a meet official (timers, stroke & turn, etc.). In the top nav, and also linked from the footer, About, and Join. | Decided — new page |
| 404 | "Page not found" with links back to main pages. | Built (`src/pages/404.html`) |

## Removed / deferred

| Item | Decision |
| --- | --- |
| News page | Removed. No replacement for now. |
| Notice bar for urgent updates | Not now; revisit if needed. |
| Past Seasons page | Not needed; season pickers cover archives. |
| Records PDF and PDF importer script | Removed; `records.json` becomes the single source of truth. |
| Roster / schedule PDF buttons | Removed (they never linked anywhere). |
| Top 10 all-time | Deferred — no data source yet; explore later. Remove the dead nav link now. |

## Open

- Join: own page vs. section of About — decide once content is written.
