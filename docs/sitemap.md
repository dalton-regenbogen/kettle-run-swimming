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
Meets · Practice · Results · Records   [KR logo → Home]   Roster · Join · About · Resources
```

Eight flat links, four on each side of a centered logo, no dropdowns. Left side: competition and schedules.
Right side: the team and getting involved. Resources is also linked from the footer.

## Pages

| Page | Purpose | Status |
| --- | --- | --- |
| Home | Point people to what they need right now. Shifts by date: preseason leads with joining; in season leads with next meet and this week's practices. | Decided — redesign |
| Meets | When and where each meet is, with start time, venue, opponents, status. | Decided — keep separate from Results |
| Practice | When and where practices are; opens at the current week. | Decided — keep |
| Results | Meet-by-meet scores and championship results; past seasons via a season picker. | Decided — keep separate from Meets |
| Roster | Team members by season, with All/Boys/Girls filter and season picker. No PDF. | Decided — keep |
| Records | All-time team bests. Web page only — no PDF download. | Decided — keep; remove PDF |
| Join | Interest meeting, tryouts, requirements, forms, commitment, coach contact. | Decided — content to be written by coach. Own page recommended; becomes a section of About if content is short. |
| About | Program description, coaches/staff, contact. Links to Resources. | Decided — keep |
| Resources | Team handbook, state qualifying times, and how to become a meet official (timers, stroke & turn, etc.). In the top nav, and also linked from the footer, About, and Join. | Decided — new page |
| 404 | "Page not found" with links back to main pages. | Decided — add |

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
- Old URLs (e.g. `competition-schedule.html`, `2025-2026-results.html`): keep or forward to new names — decide when pages are rebuilt.
