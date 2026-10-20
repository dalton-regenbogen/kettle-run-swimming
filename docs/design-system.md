# Design system

The visual rules every page follows. Each section is filled in as it's decided.

- **Where it lives in code:** `src/css/input.css` (the `@theme` block, the dark-mode block, and the `type-*` utilities).
- **See it live:** `style-guide.html` shows every class in the current light/dark mode.
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

Clean and compact, in the spirit of Apple Sports. Chosen on the Records preview (`lab-records.html`).

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
- Black bar with eight links, four on each side of a centered logo (`kr-logo-tight.svg`, 40px tall; 30px on phones).
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
  (e.g. "Last updated", `bg-white/20 text-white`). Centered on phones, left-aligned on desktop. In dark mode it
  gets a faint outline (`dark:ring-1 dark:ring-white/15`) so it doesn't disappear into the black page.
- **Section cards**: `rounded-2xl border border-line bg-surface shadow-sm`, with a header row containing a green
  accent bar (`h-9 w-1.5 rounded-full bg-accent`), a `type-section` title, and a `type-small` subtitle.

### Tables (from the original site)

- Header row: solid `bg-brand` with white `font-semibold` labels.
- **Clean rows:** a thin `border-line` between rows on every screen size, no zebra stripes.
- `table-fixed` with set column widths so related tables line up.
- **Groups** (e.g. "Individual" / "Relays"): each group is its own `<tbody>` whose first row is a
  `<th scope="rowgroup">` heading — `type-label`, semibold, `text-fg-muted`, no fill, extra space above. Screen
  readers announce the group name for each row, and `first:`/`last:` styles count within each group.
- Phones: each row becomes a two-line block — main item and number on top, secondary details below — with a
  matching "Event | Name … Time | Date" header.
- Times use tabular numbers (`type-table`) in `font-medium`. On desktop a badge sits next to the time; on phones
  it moves to the second line after the name so every time stays aligned on the right edge.
- Badge text should explain itself (e.g. "State Record") so no legend is needed.

### Logo

`kr-logo-tight.svg` is `kr-logo.svg` with its empty square padding cropped (only the `viewBox` changed), so the
logo's size class matches its visible size. The original file is still used by legacy pages.
