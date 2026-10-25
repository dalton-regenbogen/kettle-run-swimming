# Design system

The visual rules every page follows. Each section is filled in as it's decided.

- **Where it lives in code:** `src/css/input.css` (the `@theme` block, the dark-mode block, and the `type-*` utilities).
- **Rebuilt pages** start their `<head>` with `<!-- include: head.html -->` (fonts, stylesheet, shared meta tags)
  and use `<body class="bg-page font-body text-fg antialiased">`.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display (page titles, section headings, big numbers, scores) | **Inter Tight** | Inter redrawn with tighter spacing for large sizes. |
| Body (paragraphs, nav, tables, labels, buttons) | **Inter** | Built for screens; very readable at small sizes and in tables. |

- Both are free from Google Fonts and look the same on every device.
- Times, scores, and other numbers in columns use **tabular numbers** (`tabular-nums` in Tailwind) so digits line up.
- Chosen over: system font (varies by device), Barlow, Oswald, Mona Sans, Geist, Archivo — see the typography lab rounds 1–2.

### Type scale ("Extra compact")

Each role is one Tailwind class: `type-title`, `type-section`, `type-sub`, `type-number`, `type-body`, `type-table`, `type-small`, `type-label`, `type-nav`, `type-button`. Fonts: `font-body` (Inter), `font-display` (Inter Tight).

Clean and compact, in the spirit of Apple Sports. Chosen on a Records preview page (since removed).

| Role | Phone | Desktop (≥768px) | Weight | Line height | Letter spacing | Font |
| --- | --- | --- | --- | --- | --- | --- |
| Page title | 24px | 28px | 650 | 1.1 | -0.025em | Inter Tight |
| Section heading | 17px | 18px | 600 | 1.2 | -0.015em | Inter Tight |
| Subheading / card title | 14px | 15px | 600 | 1.3 | -0.01em | Inter Tight |
| Big number (scores, featured times) | 20px | 24px | 600 | 1 | -0.02em | Inter Tight, tabular |
| Body | 14px | 14px | 400 | 1.55 | — | Inter |
| Table text | 13px | 13px | 400; times 500 | 1.4 | — | Inter, tabular |
| Small / meta (dates, "Updated") | 11px | 12px | 400 | 1.45 | — | Inter |
| Label (uppercase) | 10px | 10px | 500 | 1.3 | 0.06em | Inter |
| Nav | 13px | 14px | 500 | — | — | Inter |
| Button | 13px | 14px | 600 | — | — | Inter (provisional — not yet reviewed) |

- Text uses antialiased rendering (Tailwind `antialiased` on `<body>`) for thinner, crisper text on Mac.
- Weights are deliberately light: headings 600–650 rather than bold 700+, times 500 rather than 600.
- The 10–11px sizes are small; recheck labels and dates on a real phone when pages are built.
- Spacing (row padding, gaps) is not part of this scale — it's decided in the spacing step.

## Color

Starts from the site's existing colors ("Classic" in the color lab) and supports both light and dark mode,
following each visitor's device setting (`prefers-color-scheme`). **Provisional:** colors are double-checked on
each page as it's built and adjusted here.

Every element uses a **color role**, never a raw color. Light and dark mode assign different colors to the same roles.

| Role (Tailwind name) | Example classes | Used for | Light | Dark |
| --- | --- | --- | --- | --- |
| `page` | `bg-page` | Page background | `#F4F4F5` | `#000000` |
| `surface` | `bg-surface` | Cards, tables | `#FFFFFF` | `#1C1C1E` |
| `line` | `border-line`, `divide-line` | Row dividers, card outlines | `#E4E4E7` | `#2C2C2E` |
| `fg` | `text-fg` | Main text | `#111111` | `#F5F5F7` |
| `fg-muted` | `text-fg-muted` | Secondary text (descriptions) | `#52525B` | `#C7C7CC` |
| `fg-subtle` | `text-fg-subtle` | Quiet text (dates, labels) | `#71717A` | `#A1A1A6` |
| `header` / `header-fg` | `bg-header`, `text-header-fg` | Site header and its links | `#000000` / white 80% | `#000000` / `#F5F5F7` 80% |
| `accent` | `text-accent`, `bg-accent` | KR green — links, active states | `#005130` | `#34C77B` (brighter, readable on black) |
| `on-accent` | `text-on-accent` | Text on top of `accent` (e.g. buttons) | `#FFFFFF` | `#000000` |
| `highlight` | `bg-highlight`, `border-highlight` | KR orange — stripes, fills, emphasis | `#F37322` | `#F37322` |
| `badge` / `badge-fg` | `bg-badge`, `text-badge-fg` | Small labels like "VHSL Class 3" (yellow, as on the original site) | `#FEF08A` / `#111111` | yellow 20% / `#FDE047` |
| `brand` | `bg-brand` | KR green that does **not** change in dark mode — fills such as table header rows | `#005130` | `#005130` |

### Rules

- **Orange is never small text on a light background.** KR orange on white is 2.9:1 contrast; small text needs
  at least 4.5:1. Use it for stripes, fills, and badges. If orange text is ever needed, use `#C2550F` (4.6:1).
- **KR green is too dark for dark mode.** On black it's 2.2:1, so `accent` (text, links, accent bars) uses `#34C77B`
  in dark mode (9.6:1). `brand` stays `#005130` for filled areas with white text on top (9.5:1).
- Secondary/quiet gray text was chosen to pass 4.5:1 in both modes.
- Win/loss colors, form states, and other roles get added when the pages that need them are built.
- Dark mode header/page separation: solved by the header's faint bottom hairline (`border-white/12`).

## Spacing and shape

Not yet decided.

## Components

### Focus outline

Keyboard users get a 2px KR orange outline (`:focus-visible` rule in `input.css`). It never appears after a tap or
mouse click. Don't remove focus outlines — people navigating by keyboard need them to see where they are.

### Site header — `src/partials/site-header.html`

Based on the original site header, refined ("E" in the header lab).

- Thin top strip reading "Kettle Run Swimming" (10px, medium, wide letter spacing, 70% white), same black as the
  header with a hairline underneath (`border-b border-white/12`). The footer's bottom row mirrors this.
- Black bar with eight links, four on each side of a centered logo (`kr-logo-tight.svg`, 40px tall; 30px on phones):
  About · Join · Practices · Meets | Roster · Results · Records · Resources. The phone menu lists the same eight.
- Links: 12px, uppercase, medium weight, 0.08em letter spacing (same as the footer), 85% white. Hover and current page: KR orange text.
- No colored bottom bar — only a faint hairline, which also separates the header from the page in dark mode.
- Phones: logo left, "Menu" button right. The menu is **full screen**: a native `<dialog>` opened with
  `showModal()` (focus stays inside it). Close and Escape both run `closeMenu()` in `site.js`. Keyboard users
  get focus returned to the Menu button; after a tap/click it isn't, so no outline appears. Its top repeats the header strip and
  logo with "Close" in place of "Menu"; links are 13px with 48px-tall tap rows.
  `site.js` focuses the dialog itself on open (`tabindex="-1"` + `menu.focus()`), so nothing is outlined.
  The page behind can't scroll while it's open (`html:has(dialog[open])` in `input.css`).
- The current page is marked automatically at build time: nav links have `data-nav-link`, and `scripts/build.mjs`
  adds `aria-current="page"` to the link pointing at the page being built. CSS styles it with
  `aria-[current=page]:text-highlight`.

### Site footer — `src/partials/site-footer.html`

Compact, designed to match the header.

- Black background with a faint top hairline. Top row: logo (20px) + "Kettle Run Swimming" (10px uppercase) on the
  left, links on the right (Resources · Join the team · About · Email the coach — 10px uppercase, medium, 0.08em
  tracking, 85% white, orange on hover). On phones these stack and center with extra room (`py-7`, `gap-5`).
- Bottom strip ("stacked"), centered on every screen size: Kettle Run High School / address / © school year, on
  three lines. 9px uppercase, regular weight, 60% white (the year a little dimmer), `gap-1.5`, `py-5`, same black
  with a hairline above (`border-t border-white/12`) — mirroring the header's top strip. The school year (e.g. 2026–2027) is set by `js/site.js` and rolls over each August.

### Page layout (from the original site)

Rebuilt pages keep the original site's page structure, restyled with the new type and colors. Records is the
reference implementation (`src/pages/team-records.html`).

- `<body class="flex min-h-dvh flex-col bg-page font-body text-fg antialiased">`, `<main class="… flex-1">` keeps
  the footer at the bottom of short pages.
- Content width `max-w-6xl`. On desktop everything sits inside one **page card**:
  `md:rounded-2xl md:border md:border-line md:bg-surface md:p-6 md:shadow-xs`.
- **Hero band** at the top: black, `rounded-2xl`, with the `hero-texture` diagonal lines. Eyebrow
  (`type-label`, wide tracking) → `type-title` → one-line `type-small` description; an optional pill on the right
  (`bg-white/20 text-white`). Every page words it the same: "Last updated Feb 23, 2026". Centered on phones, left-aligned on desktop. In dark mode it
  gets a faint outline (`dark:ring-1 dark:ring-white/15`) so it doesn't disappear into the black page.
- **Section cards**: `rounded-2xl border border-line bg-surface shadow-sm`, with a header row containing a green
  accent bar (`h-9 w-1.5 rounded-full bg-accent`), a `type-section` title, and a `type-small` subtitle.

### Tables (from the original site)

Used for Records, Roster, Meets, and Practice (the week grid below).

- Header row: solid `bg-brand` with white `font-semibold` labels.
- **Clean rows:** a thin `border-line` between rows on every screen size, no zebra stripes.
- `table-fixed` with set column widths so related tables line up.
- **Groups** (e.g. "Individual" / "Relays"): each group is its own `<tbody>` whose first row is a
  `<th scope="rowgroup">` heading — `type-label`, semibold, `text-fg-muted`, no fill, extra space above. Screen
  readers announce the group name for each row, and `first:`/`last:` styles count within each group. The heading's
  left padding matches the first column's, so it lines up with the row text.
- **Phones vs desktop columns** (Meets): rows carry both sets of cells — phone cells `md:hidden`, desktop cells
  `hidden md:table-cell` — with a header row for each size. Each header row's widths add up to 100%, so hidden
  columns can't take up space.
- Phones: each row becomes a two-line block — main item and number on top, secondary details below — with a
  matching "Event | Name … Time | Date" header.
- Row text: 13px on desktop (main item regular), 12px on phones (main item semibold); second lines 11px.
- Dates and times use tabular numbers (`type-table`) in `font-medium`. On Records, desktop puts a badge next to the
  time; phones move it to the second line after the name so every time stays aligned on the right edge.
- Columns with headers are left-aligned, times included. (The Records phone block puts the time on the right
  because it's a two-line block, not a column.)
- Badge text should explain itself (e.g. "State Record") so no legend is needed.

### Controls (first used on Roster)

- **Segmented filter** (e.g. All / Boys / Girls): `<button>`s with `aria-pressed` inside a
  `rounded-lg bg-fg/5 p-1` group. Pressed button: `aria-pressed:bg-surface aria-pressed:text-fg
  aria-pressed:shadow-sm`; others `text-fg-muted`. `type-button` text.
- **Select** (e.g. Season): native `<select>` with `rounded-lg border border-line bg-surface px-2.5 py-1.5`,
  13px medium text, with a `<label>` (visually hidden on phones with `sr-only md:not-sr-only`).
- Controls sit on the right of a section card's header row on desktop and wrap below the title on phones
  (`flex-wrap`, so very narrow screens stack them instead of overflowing).

### Avatars

Initials in a `bg-brand` circle with white 11px semibold text: `size-8` on phones, `size-9` on desktop.

### Badges

Small yellow tags (`bg-badge text-badge-fg`, 9px on phones / 10px on desktop, semibold, `rounded-sm`) for
standout facts: "State Record" next to a record time, "Captain" next to a roster name. Text explains itself; no legend.

Two other tags use the same shape: **"Next meet" / "This week"** (`bg-highlight text-black`, with the row tinted
`bg-highlight/10`) and **status** such as "Canceled · Weather" (`bg-fg/10 text-fg`, row dimmed, time crossed out).

### Link cards (first used on the 404 page)

A grid of links (`sm:grid-cols-2 md:grid-cols-3`), each a `rounded-xl border border-line px-4 py-3` block with a
`type-sub` title, a `type-small text-fg-muted` description, and an arrow that turns orange on hover. The border
darkens to `fg-subtle` on hover.

### Meet table (Meets page)

Standard table, grouped by part of the season ("Regular Season" / "Post Season", from the data).

- **Desktop:** Date · Meet · Location · Time.
  - Date: "Dec 6" (medium) over the weekday "Sat" (gray).
  - Meet: the type ("Double Dual") with any tags, over "vs Brentsville District, Sherando" (school names without
    "High School"; championships show their name, e.g. "Northwestern District").
  - Location: the pool's full name over "Away · Hosted by Brentsville".
- **Phones:** Date · Meet · Time. The meet cell adds the pool as a third line; Home/Away goes under the time.
- **In season:** the next meet that's still on gets the "Next meet" tag; earlier meets are dimmed. In the
  offseason nothing is dimmed.

### Results tables (Results page)

- **Season summary:** regular season and postseason are kept apart by a thin vertical line (`border-white/20` in
  the header, `border-line` in the rows). Desktop adds a grouping header row (`scope="colgroup"`, `type-label`,
  70% white): "Regular season" over Record · Win % · Streak, "Postseason" over one column per championship.
  Phones get their own table: one row per stat (Record, Win %, Streak, Districts, …) with **Boys | Girls** as
  centered columns, grouped by `rowgroup` headings "Regular season" / "Postseason" like Records. The corner cell is
  empty (screen readers hear "Stat"). Everything is counted from the data.
- **Meet cards** (Regular season, Postseason), based on the original Results page — one card per meet. Side by
  side from `lg` (1024px); phones and tablets get a stacked card with everything centered. (Tablets don't have
  room for five columns; font sizes still change at `md`.)
  - **Rail:** Home / Away / Neutral in `type-label` on a colored strip — orange (`bg-highlight`, black text) home,
    green (`bg-brand`) away, `bg-fg` neutral. A column with sideways text on desktop (`[writing-mode:vertical-rl]
    rotate-180`), a strip across the top on phones.
  - **Date:** weekday / "Dec 6" (13px medium) / time on desktop; one 12px medium line on phones
    ("Saturday, Dec 6 · 6:00 PM").
  - **Meet:** type (main item: 13px regular desktop, 12px semibold phones) with any status tag, the opponents in
    gray, and the pool in a gray chip (`bg-fg/5`).
  - **Boys / Girls panels** side by side (`rounded-lg border border-line`), `type-label` heading, two 20px lines
    (`leading-5`, `min-h-10`). Scores read "W KR 117–99 SHS": letter semibold (accent for W, gray for L), "KR" and
    the school abbreviation 11/12px gray, score medium; hovering shows the full school name. Championships:
    "6th of 10"; canceled: "Canceled" over "Weather".
  - **Closed by default, equal height:** each panel shows its first result, and its second line is the toggle —
    "+2 more" / "Show less", or "Show standings" / "Hide standings" (accent text button, `aria-expanded`). Any
    toggle opens the whole card (adds `data-open`; children use `group-data-open:` classes), so Boys and Girls
    stay side by side. The opponents line is cut to one line until the card opens.
  - **Full results:** a plain accent text link (PDF, new tab), in its own column on desktop (kept even when empty
    so panels line up) and a centered row under the panels on phones.
  - **No green header row** on the card sections: the green row labels table columns elsewhere, and cards have
    no columns.

### Week grid (Practice page)

A table with one row per week and one column per practice day, in the standard table style, on every screen
size. All text — no tiles.

- **Card header subtitle:** the standard schedule, worked out from the data — "Standard practice schedule:
  Monday–Thursday, 3:30–4:30 PM @ WARF" on desktop, "Standard schedule: Mon–Thu, 3:30–4:30 PM @ WARF" on phones
  (short enough for one line). The time and place never break apart (`whitespace-nowrap`).
- **Columns:** Week · one column per practice day ("Mon" on phones, "Monday" on desktop, taken from the data).
- **Week cell:** "Week 1" over the date range — phones 12px semibold over 11px gray; desktop 13px regular over
  12px gray.
- **Day cells:** the same two-line pairing. The date ("Nov 24", medium, like dates in the Meets table) over a gray
  label: "Regular practice" / "No practice" on desktop, "Practice" / "Off" on phones. No practice = gray,
  crossed-out date.
- **In season:** the current week is tinted (`bg-highlight/10`) with a "This week" tag; past weeks are dimmed.
  In the offseason nothing is dimmed.

### Home page

- **Hero:** the standard black textured band; text on the left and the framed photo carousel (`rounded-xl`, 4:3)
  on the right from `lg`; photo on top and text centered on phones and tablets.
  - Eyebrow "Kettle Run High School" with short orange lines (`h-0.5 w-8 bg-highlight`): one on each side on phones,
    only the leading one on desktop.
  - `type-title`, then the welcome paragraph at table size (12px phones / 13px desktop, 75% white).
  - Buttons at the site's standard size (`type-button rounded-lg px-3.5 py-2`): primary in school green (`bg-brand`,
    faint white inset ring so it holds its shape on black; text changes with the season), secondary outlined
    (`border-white/30`). Phones: two equal-width buttons (stacked under 360px).
  - Quick facts: three equal columns under a hairline (`border-t border-white/12`, like the header and footer lines),
    `type-sub` number over `type-label`.
  - Explored and set aside: green, gradients, two-color blends, light, photo background, split panels, slanted photo
    with trim, stripes, watermark, other accent placements.
- **Carousel:** photos fade; small 6px dots (larger invisible tap area) and a small pause button on a faint gradient —
  centered at the bottom on phones, dots left / pause right from `md`. Faint arrows (`bg-black/25`, 80% white,
  firmer on hover) at the left/right middle from `md`; none on phones, where you swipe. The pause button stays because the photos change on their own
  (WCAG: anything moving by itself for more than 5 seconds must be pausable). No autoplay with reduced motion;
  pauses on hover/focus; only the visible photo is exposed to screen readers.
- **Below the hero:** two full-width section cards, stacked (nothing has to line up, so no leftover white space).
  - **"Right now"** changes with the date. All three versions share one shape where possible:
    - Preseason — **Join the team**: three steps across (1 · Interest meeting, 2 · Forms, 3 · First practice).
    - In season — **This week**: three blocks across — Practice (days; a time only when different from usual),
      Latest result (spelled out: "Won 2 · Lost 1", "6th place"), Next meet — each ending in an accent "… →" link.
    - Offseason — **Season recap**: Boys / Girls panels with the dual record and places spelled out
      ("6th at Regionals", "Districts canceled").
    - Blocks use a `type-label` heading, 12/13px main lines (dates medium), 11/12px gray second lines.
  - **Up next**: rows of three dates read left to right (one column on phones), one full-width line between rows.
    Each date is a small solid block ("NOV" over "10"): school green for team events and practices, school
    orange with black text for meets. Next 6 upcoming; "Show all season dates" swaps in the whole season
    (past dates dimmed). No green table header — that's for data tables.
- **No separate contact card:** "Contact coach" is always in the hero, and the footer has Email the coach and
  Resources, so each action shows once on screen.
- **Links:** accent text links ("… →"). Orange text was tried and set aside — too low-contrast on white at link size.

### Text pages (first used on Join)

Join, Resources, and About are mostly words. They reuse the section cards and add:

- **Body text:** `type-body text-fg-muted`, kept to `max-w-prose` so lines stay readable.
- **Steps:** an `<ol>` of blocks across (`sm:grid-cols-2 lg:grid-cols-4`, thin dividers); `type-label` heading with
  an orange step number, a 12/13px main line, an 11/12px gray line.
- **Link rows** (e.g. the four forms, filled from `season.json`): a small accent-tinted icon tile, name over note,
  and "Open form ↗" on the right — or gray "Link coming soon" while the link is empty.
- **Term list:** `<dl>` rows — 12/13px semibold term ("Fees", "Team suit (optional)") over gray small text.
- **Side-by-side panels:** two `rounded-xl border` panels; `type-label` accent heading, a semibold line, a small
  bulleted list (`list-disc marker:text-fg-subtle`).
- **Comparison table:** the standard green-header table (it has real columns); scrolls sideways inside its card on
  phones (`overflow-x-auto`, `min-w-[40rem]`) instead of squeezing.
- **Callout:** an important note with an orange edge — `border-l-4 border-highlight bg-highlight/10`.
- **FAQ:** `<details>`/`<summary>` rows with a + / − marker; the answer in small gray text.
- **Contents list** (long pages, first used on Resources): desktop — a list in a left column that stays in view
  (`lg:sticky lg:top-32`), each link with a left border that turns accent on hover; phones — the same links as a
  row of rounded chips that scrolls sideways. Section cards get an `id` and `scroll-mt-24 md:scroll-mt-32` so a
  jump doesn't land under the sticky site header.
- **Sub-sections inside a card:** `type-sub` headings, divided by thin lines.
- **Big-number panels** (e.g. lettering limits): `type-number` in accent over a semibold label and a gray line.
- **Placeholders:** a link that isn't set in `season.json` yet becomes the same text in gray with "(link coming
  soon)"; the handbook PDF link hides instead.
- **External links** open in a new tab with a hidden "(opens in a new tab)" note for screen readers.

### Logo

`kr-logo-tight.svg` is `kr-logo.svg` with its empty square padding cropped (only the `viewBox` changed), so the
logo's size class matches its visible size. The original file is still used by legacy pages.
