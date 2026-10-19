# Design system

The visual rules every page follows. Each section is filled in as it's decided in the design lab.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display (page titles, section headings, big numbers, scores) | **Inter Tight** | Inter redrawn with tighter spacing for large sizes. |
| Body (paragraphs, nav, tables, labels, buttons) | **Inter** | Built for screens; very readable at small sizes and in tables. |

- Both are free from Google Fonts and look the same on every device.
- Times, scores, and other numbers in columns use **tabular numbers** (`tabular-nums` in Tailwind) so digits line up.
- Chosen over: system font (varies by device), Barlow, Oswald, Mona Sans, Geist, Archivo — see the typography lab rounds 1–2.

### Type scale ("Extra compact")

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

Not yet decided.

## Spacing and shape

Not yet decided.

## Components

Not yet decided.
