# Kettle Run Swimming — working project brief

This document records the direction expressed after the [project review](/Users/daltonregenbogen/kettle-run-swimming/PROJECT_REVIEW.md). It separates established preferences from implementation proposals. A separate local [dark homepage study](/Users/daltonregenbogen/kettle-run-swimming/HOMEPAGE_DARK_STUDY.md) has now been implemented; the current homepage and wider site remain unchanged.

## 1. Established direction

| Area | Direction from the project owner |
| --- | --- |
| Core technologies | Keep straightforward HTML, Tailwind CSS, and JavaScript as the foundation. |
| Learning | Every addition must be understandable. Explain new concepts, how they work, why they help, and how to change them independently. |
| Technical growth | Improvements to structure and best practices are welcome when their value and operation are clear. Shared header/footer templates are welcome in principle. |
| Maintenance | The owner is the only person who needs to maintain the project for now. |
| Current hosting | GitHub Pages connected to this repository, confirmed by the owner. Exact publishing branch/folder or Actions configuration still needs inspection before implementation. |
| Homepage priority | Make current-team information easiest to find: next meet, practice, results, and updates. |
| Design | Make all pages stylistically consistent. Preserve useful existing ideas while iterating, including on the hero and especially the content beneath it. |
| Homepage direction selected for iteration | Start with the dark alternative. Keep the school logo in the header; its position is open. Remove the hero's year/class/season trio. Pursue clean, minimal, sporty character and review generic decorative patterns and copy. |
| Scope of change | Substantial changes are acceptable. Existing implementation does not need to be preserved merely because it exists. |
| Interactions | Keep features with a clear purpose, such as All/Boys/Girls roster filters. Avoid adding complexity without a corresponding benefit. |
| Content editing | Explore a useful editing interface accessible on phone and laptop, particularly for records, meets, results, and season rosters. Direct JSON editing remains an acceptable fallback. |
| Publishing expectation | The editor should publish changes to the live site after a preview and explicit confirmation, including from a phone. A JSON-export-only interface does not satisfy the selected publishing goal. |
| Static content | Ordinary informational pages and sections can remain static. |
| Downloads | Review each download's purpose. Remove unnecessary controls instead of assuming every page needs a PDF. |
| Current stage | Iterate on a separate local homepage design study. Full site migration, shared templates, admin tools, and production publication remain later work. |

These preferences do not select a template engine, CMS, new season, final sitemap, or finished visual design. The dark alternative is selected as the current homepage iteration direction. GitHub Pages is the established hosting baseline; no hosting migration is selected.

## 2. Proposed technical shape

Keep three familiar kinds of source:

- **HTML and shared templates** describe page structure.
- **Tailwind and a small amount of authored CSS** describe appearance.
- **JavaScript** handles useful interactions, such as menu controls and roster filters.

Keep frequently updated information in straightforward structured files, initially JSON. Handwritten program information can stay in HTML. Any future editing interface should update the same canonical content files or another explicitly selected canonical store; it should not introduce a second competing set of records.

### Shared templates, explained

At present, each page contains its own copy of the header. A shared template would hold that header in one file. During a build, a tool assembles the header, the page's content, and the footer into a complete HTML document for publication.

For example, an instruction conceptually meaning “insert the shared header here” replaces hundreds of copied lines in each source page. The generated page still contains the full header HTML. Changing the shared file and rebuilding updates every page.

This adds a small **build step**: a program prepares the files before publication. Tailwind already introduces that concept by turning `src/input.css` into `css/output.css`. The new part would be assembling HTML as well.

**Proposed preference:** use shared templates during the build so the visitor receives complete HTML. A small established generator such as Eleventy is a candidate because it supports layouts and HTML-like templates. Choose it only after explaining a single representative page and its generated output. [Eleventy layouts](https://www.11ty.dev/docs/layouts/) and [Liquid templates](https://www.11ty.dev/docs/languages/liquid/) document these capabilities.

For mostly static data, the build could also generate initial roster/schedule rows from JSON. Browser JavaScript would then add filtering and other interactions to content already present. Whether each existing renderer changes should be decided incrementally.

Template selection and migration remain future planning decisions.

### Publishing through the existing GitHub Pages setup

The owner confirmed that the live website uses GitHub Pages connected to this repository. A proposed workflow that preserves that hosting arrangement is:

1. Edit content through an authenticated interface on phone or laptop.
2. Validate and preview the draft without changing the public site.
3. Confirm publication, allowing the approved content to enter the publishing branch.
4. Run automated validation and the site build using GitHub Actions.
5. Deploy the generated HTML, CSS, JavaScript, and assets to GitHub Pages.
6. Report success only when publication completes; retain a useful error/recovery state otherwise.

GitHub Actions is GitHub's automation service: instructions in the repository tell it which checks and build commands to run. Pages supports deployment of the generated site through a [custom Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). This is a proposed future configuration; no workflow has been added or deployed, and the repository's current remote publishing settings have not been inspected.

Pages serves the public static website. It does not itself supply the authenticated content-writing integration or a complete draft-preview workflow. Editor login, repository write access, draft storage, and preview behavior need an explicit integration choice. The editor may use an additional authentication service while the public site remains on Pages. An editor-rendered preview and a separately hosted draft site have different setup requirements; neither is assumed to be configured automatically.

## 3. Content editing: two different capabilities

A form that edits data and a system that publishes data are separate pieces. The interface can be simple while publishing still needs an authenticated destination and a reliable deployment path.

| Workflow | What the owner would do | What is required | Limitation |
| --- | --- | --- | --- |
| Edit JSON directly | Change a content file, preview, and publish through the normal workflow. | Clear data conventions, validation, preview instructions. | Requires opening/editing files. |
| Form with export | Enter information in a form, then download the resulting JSON. | A browser interface and validation. | Does not update the live site; exported files still need to be published. A phone download alone does not replace a repository file. |
| Form with direct publishing | Sign in, edit fields, review the change, and publish. | An authenticated integration that writes content, plus deployment and publish-status feedback. | More setup and a service/integration to maintain. |

**Selected goal:** direct publication after preview and confirmation from phone or laptop. The integration and implementation timing remain open.

**Proposed fit:** a small administration area backed by the Git repository, with ordinary content files remaining available for manual editing. A Git-backed CMS, such as Decap, is one option to evaluate. Its UI writes repository content; a configured publishing workflow then builds/deploys the website. Its [overview](https://decapcms.org/docs/intro/) describes the model, and its [GitHub integration](https://decapcms.org/docs/github-backend/) documents authentication requirements. This is an option, not a selected product or a promise of phone usability before evaluation.

A one-owner site still needs authentication for remote writes. Credentials and private application secrets must not be placed in public HTML/JavaScript or committed to a public repository. Login can use an existing provider rather than a custom password system, depending on the chosen integration.

**Publishing flow to design:** edit → validate → preview the affected public content → explicitly confirm publication → show publishing progress → confirm that the change is live. If publication fails, retain the entered content and offer a clear recovery path. A generic form preview and a deployed draft-site preview are different capabilities; choose the preview approach when evaluating the publishing integration.

Saving content to a repository and deploying it successfully are separate events. The editor should distinguish them accurately. The preference for preview/confirmation defines future product behavior; it does not authorize deployment of the current project during planning.

### Candidate editor scope

Start with concrete tasks instead of a general page builder:

| Task | Useful fields / behavior |
| --- | --- |
| Add or edit a meet | Season, date, time, opponents, venue, host, status, and practical arrival notes. |
| Enter meet results | Select an existing meet; enter dual scores or championship placements; attach/link the source results. |
| Add a season swimmer | Season, first/last name, team, grade, and the existing agreed roster fields. |
| Update a team record | Select event/group, enter time/date/holder, review the previous value, and retain agreed distinctions. |

These are the owner's candidate tasks, not a commitment to implement all four at once. Announcements, practice exceptions, and important dates can be considered if they are maintained frequently enough. Editing layout, colors, navigation structure, or arbitrary page HTML through an admin interface is not currently established as a requirement.

For any selected task, design for labeled fields, useful defaults, clear validation, unsaved-change handling, an understandable review step, and accurate saved/published status. The exact behavior depends on the selected publishing integration. Existing data should remain readable and changes recoverable.

## 4. Proposed design process

### First: agree on the jobs each page performs

For each page, write a short answer to: who opens it, what they need, which information is essential, and which action should be easiest. A page without a useful purpose can be merged or omitted.

**Selected homepage priority:** current-team logistics. Visitors should quickly find the next meet, practice information, results, and updates. Program identity and a path for prospective swimmers remain useful secondary content; the exact layout is still open.

### Then: establish a common visual language

Review these together using the current site and its experiments:

- Green/orange/black palette and background surfaces.
- Heading and body typography, including the role of condensed type.
- Content widths, spacing, borders, shadows, and corner radii.
- Shared navigation, footer, page introductions, buttons, and focus styles.
- Data tables/cards, filter controls, status labels, and small-screen behavior.

The existing roster and records pages are useful starting references, not final approved designs. Consistency means shared rules across page types; it does not require every page to use the same layout or turn every section into a card.

**Comparison and subsequent decision:** the [visual comparison](/Users/daltonregenbogen/kettle-run-swimming/DESIGN_COMPARISON.md) provides desktop/phone boards and observations. After that comparison, the owner selected C, the dark alternative, as the starting direction for homepage iteration. The earlier light/warm recommendation is not the selected direction. The [dark homepage study](/Users/daltonregenbogen/kettle-run-swimming/HOMEPAGE_DARK_STUDY.md) implements a logo-led header, simplified hero without the statistic trio, and two unboxed content arrangements for review.

### Then: explore the homepage

Compare a few low-detail arrangements before committing to polished HTML. Review hero and below-hero content together so they serve a coherent purpose.

Potential ingredients include a concise program introduction, a selected team photo, next event details, genuine updates, recent results, a joining/forms path, and contact information. None is automatically required. A section should have real content, an owner, and a useful visitor purpose before it earns space.

#### First layout proposal for review

| Order | Section | Purpose / content source |
| --- | --- | --- |
| Conditional top notice | Urgent changes only | A genuine cancellation or important deadline can appear prominently, with an expiry or explicit removal. This remains a proposed feature. |
| 1 | Compact hero | Team name, current season/status, selected photography, and a brief introduction. Keep the practical section below easy to reach, especially on phones. |
| 2 | This week / upcoming activity | Emphasize the next meet's date, time, venue, and status. Include relevant practice details and exceptions using the same data as the full schedules. |
| 3 | Latest results | Most recent completed meet, useful summary, and a direct results link. Derive repeated facts from the results source. |
| 4 | Team updates | A short chronological list of genuine announcements. Omit the section when there is no useful content rather than displaying sample copy. |
| 5 | Secondary paths | Required forms/resources, coach contact, and joining information, with prominence adjusted to seasonal needs. |

This is an information hierarchy, not a final card layout or a decision to implement every proposed section. On mobile, next-meet and practice information should remain ahead of secondary program copy. Next event, most recent result, and archived-season states need explicit definitions so completed or canceled meets are not presented as upcoming activity. During offseason, show an intentional season status and relevant next steps.

For example, if the homepage includes a “next meet,” that meet should come from the same reviewed data as the schedule. If there are no upcoming meets, display an intentional offseason/archive state rather than stale information. If announcements cannot be kept current, a stable information section may serve visitors better.

### Downloads and small interactions

Evaluate each feature by asking what it helps someone do. Keep the roster filters because they offer a clear way to find a team. Treat calendar downloads, print views, accordions, carousel rotation, and result expanders as individual decisions. A download control should exist only when a useful, current destination exists.

## 5. Learning and explanation agreement

For every meaningful implementation batch:

1. **Name the problem.** Show a concrete example from this project.
2. **Explain the new concept.** Use familiar HTML/CSS/JavaScript terms and a small example where helpful.
3. **Show the flow.** Identify which source files are edited, what runs during the build, and what runs in the visitor's browser.
4. **Keep the change focused.** Introduce a limited number of new ideas at once, with a working page to inspect.
5. **Show independent maintenance.** Explain exactly where to change content, styling, or behavior afterward.
6. **Verify the result.** Check relevant behavior, data, accessibility, and layout, and explain what those checks establish.
7. **Document the workflow.** Record a short practical guide, especially for a new build or publishing step.

Use comments for intent or non-obvious behavior. Explain essential concepts in the conversation/documentation as well; comments alone should not carry the teaching burden. Treat additional tools as decisions with an ongoing maintenance cost.

## 6. Order of work proposed for discussion

| Step | Outcome |
| --- | --- |
| 1. Confirm homepage priorities and publishing expectations — complete | Current-team information first; direct publishing after preview/confirmation. Tool selection, preview type, and implementation timing remain open. |
| 2. Agree on sitemap and shared visual rules | Establish which pages exist and how they belong to one site. |
| 3. Review a homepage arrangement and one data-page design | Choose a coherent visual direction before spreading implementation across the project. |
| 4. Explain and demonstrate shared templates in a small agreed implementation | Make the structure understandable before migrating all pages. |
| 5. Unify data and repair correctness issues | Resolve records/PDF disagreements and duplicated meet/results facts; keep direct file editing viable. |
| 6. Build the agreed pages in manageable batches | Explain and review each meaningful addition; optimize assets and accessible interactions alongside design work. |
| 7. Add the selected content editor | Use established data fields, selected authentication, and the actual hosting/deployment workflow. |

The editor's requirements should inform the data design early even if the editor itself is implemented later. GitHub Pages is confirmed; inspect its actual publishing configuration before selecting the content-writing integration.

## 7. Decisions still open

- Preferred hero/content arrangement within the selected current-team-first homepage direction.
- Final typography and the design details to preserve from existing pages/experiments.
- Essential pages and their labels; which unfinished destinations should be merged or omitted.
- Active season and archive scope.
- Preview type and release timing for the selected direct-publishing editor.
- Which single editing task would provide the most value first.
- Exact GitHub Pages publishing configuration, editor authentication/preview integration, and acceptable setup/maintenance cost.
- Template tool, editing integration, authoritative records source, and genuinely useful downloads.

The established direction in section 1 is the constraint for these decisions. The technical/design proposals elsewhere remain open for revision.
