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
| `badge` / `badge-fg` | `bg-badge`, `text-badge-fg` | Small labels like "VHSL Class 3" | `#FDE8D8` / `#9A3D06` | orange 18% / `#FF9A5A` |

### Rules

- **Orange is never small text on a light background.** KR orange on white is 2.9:1 contrast; small text needs
  at least 4.5:1. Use it for stripes, fills, and badges. If orange text is ever needed, use `#C2550F` (4.6:1).
- **KR green is too dark for dark mode.** On black it's 2.2:1, so dark mode uses `#34C77B` (9.6:1).
- Secondary/quiet gray text was chosen to pass 4.5:1 in both modes.
- Win/loss colors, form states, and other roles get added when the pages that need them are built.
- To do: in dark mode the header and page are both black, so the header needs a divider or slightly lighter shade (decide with the header).

## Spacing and shape

Not yet decided.

## Components

Not yet decided.
