# HTML Output Style Guide

Use this guide whenever the user explicitly asks for an HTML planning document, guide, report, or visual summary.

This is a strict contract, not a loose mood board. New HTML reports must match the `project-overview.html` document-dashboard format unless the user explicitly asks for a different style.

## Recursive Scope

This guide applies recursively to every folder under `D:\market-pulse`, including domain, app, db, infra, report, and nested leaf folders, unless a more specific local guide adds stricter rules. Local guides may add detail, but they must not weaken this guide.

If an HTML report is created anywhere under the workspace, including deep child folders, use this guide as the default HTML contract.

## Guide Authoring Standard

When creating or updating any agent guide, write it as an enforceable contract.

- Specify exact file paths, reference artifacts, required read order, required DOM/class names, layout dimensions, tokens, component rules, output locations, and verification steps.
- Include forbidden patterns and anti-examples whenever the agent might otherwise reinterpret the guidance.
- Avoid vague words like "similar", "roughly", "nice", "dashboard-like", or "clean" unless they are backed by concrete rules.
- If a visual or structural reference exists, name the exact file and list the parts that must be copied.
- If a rule has an allowed exception, state the exception explicitly.
- Agents must not deviate from the guide unless the user explicitly asks for a different style or requirement in the current task.
- If the guide and a user request conflict, follow the user request and update the guide only when the user asks to make that change permanent.

## Creation Rule

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Agent-readable specs, status, logs, and working notes stay Markdown by default.
- When unsure, keep the canonical source in Markdown and ask before making HTML.
- Before writing HTML, read this guide and inspect the reference file listed below.

## Required Reference File

Canonical reference:

```text
D:\market-pulse\report\rebuild\master-plan\archive\project-overview.html
```

If that file moves, find the nearest archived/current `project-overview.html` and keep this guide updated.

The expected output is the same document format:

- fixed left sidebar
- scrollable main document
- section anchors
- compact cards and tables
- restrained colors
- project-document navigation
- no marketing hero
- no wide KPI dashboard shell

## Required HTML Skeleton

Every generated HTML report must use this top-level structure:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>...</title>
  <style>
    /* Use the tokens and component rules in this guide. */
  </style>
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-title">Market Pulse</div>
    <div class="nav-section">
      <div class="nav-section-label">...</div>
      <a class="nav-item" href="#...">...</a>
    </div>
  </nav>

  <main class="main">
    <div class="page-header">
      <h1 class="page-title">...</h1>
      <p class="page-subtitle">...</p>
    </div>

    <section id="...">
      <h2 class="section-title">...</h2>
      <p class="section-desc">...</p>
      <div class="card">...</div>
    </section>
  </main>
</body>
</html>
```

Required structure:

- `<nav class="sidebar">` is mandatory.
- `<main class="main">` is mandatory.
- `.page-header`, `.page-title`, `.page-subtitle` are mandatory.
- Every major content block must be inside `<section id="...">`.
- Every sidebar `.nav-item[href]` must point to an existing section id.
- Use `.card`, `.grid-2`, `.grid-3`, `table`, `.roadmap`, `.feat-card`, `.info-block`, `.warn-block`, `pre`, and `code` as the standard component set.

## Layout Contract

Desktop:

- `.sidebar`
  - `position: fixed`
  - `top: 0`
  - `left: 0`
  - `width: 220px`
  - `height: 100vh`
  - `padding: 24px 0`
  - `overflow-y: auto`
  - `border-right: 1px solid var(--border)`
- `.main`
  - `margin-left: 220px`
  - `padding: 40px 48px`
  - `max-width: 1100px`
  - no centered full-dashboard canvas
- `section`
  - `margin-bottom: 56px`
  - `scroll-margin-top: 80px`
- `.page-header`
  - `margin-bottom: 40px`
  - `padding-bottom: 24px`
  - bottom border

Mobile, `@media (max-width: 900px)`:

- hide `.sidebar`
- `.main { margin-left: 0; padding: 24px 20px; }`
- `.grid-2` and `.grid-3` become one column

Allowed width variation:

- Use `max-width: 1100px` by default.
- `max-width: 1180px` is allowed only for table-heavy reports.
- Do not use full viewport width for the main document.

## Required CSS Tokens

Use these exact base tokens unless the user asks for a different brand system:

```css
:root {
  --bg: #ffffff;
  --bg-alt: #fafaf9;
  --bg-panel: #ffffff;
  --bg-hover: #f5f5f4;
  --border: #e7e5e4;
  --border-strong: #d6d3d1;
  --text: #18181b;
  --text-2: #44403c;
  --text-3: #78716c;
  --text-4: #a8a29e;
  --accent: #18181b;
  --accent-fg: #ffffff;
  --up: #d62828;
  --up-soft: #fdecec;
  --down: #1e5edb;
  --down-soft: #e8eefc;
  --flat: #57534e;
  --font-sans: "Pretendard Variable", Pretendard, "Noto Sans KR", -apple-system, sans-serif;
  --font-mono: "IBM Plex Mono", "SF Mono", ui-monospace, monospace;
  --radius: 8px;
  --radius-lg: 12px;
}
```

Base reset:

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
}
```

## Component Rules

Sidebar:

- `.sidebar-title`: 11px, 700, uppercase, `.08em`, `var(--text-4)`, `padding: 0 20px 12px`.
- `.nav-section`: `margin-bottom: 20px`.
- `.nav-section-label`: 10px, 600, uppercase, `.06em`, `var(--text-4)`, `padding: 0 20px 6px`.
- `.nav-item`: block, `padding: 6px 20px`, 13px, `var(--text-2)`, no underline, no rounded pill.
- `.nav-item:hover`: `background: var(--bg-hover); color: var(--text);`.
- `.nav-item.active`: `background: var(--accent); color: var(--accent-fg);`.

Headers:

- `.page-title`: 28px, 700, margin-bottom 8px.
- `.page-subtitle`: 15px, `var(--text-3)`.
- `.section-title`: 20px, 700, flex with 8px gap.
- `.section-desc`: 13px, `var(--text-3)`, margin-bottom 20px.

Cards:

- `.card`: 1px border, 12px radius, 24px padding, 16px bottom margin, white panel.
- `.card-title`: 15px, 700, margin-bottom 8px, flex with 8px gap.
- `.card-body`: 13px, `var(--text-2)`, line-height 1.7.
- Use cards for grouped document content only. Do not nest cards inside cards.

Tables:

- `table`: width 100%, collapsed borders, 13px.
- `thead th`: `var(--bg-alt)`, uppercase 11px, 600, `.06em`, padding `10px 14px`.
- `tbody td`: padding `11px 14px`, bottom border, vertical-align top.
- `tbody tr:hover td`: `background: var(--bg-hover)`.
- `td.code`: mono 12px, `var(--text-3)`.

Grids:

- `.grid-2`: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`.
- `.grid-3`: `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;`.
- Use grids only inside the document body, never as a dashboard shell around the whole page.

Feature cards:

- `.feat-card`: 1px border, 12px radius, 20px padding, white panel.
- `.feat-title`: 14px, 700.
- `.feat-desc`: 12.5px, `var(--text-3)`, line-height 1.65.
- `.feat-path`: mono 11.5px, `var(--text-4)`, `var(--bg-alt)`, small rounded label.

Timeline:

- Use `.roadmap`, `.roadmap-item`, `.roadmap-phase`, `.roadmap-title`, `.roadmap-detail`.
- Keep the vertical line thin and neutral.
- Status colors may use done green, wip amber, plan blue, idea purple as in the reference.

Code and diagrams:

- `pre`: dark background `#0c0c0d`, 8px radius, 16px 20px padding, mono 12.5px, horizontal scroll.
- inline `code`: `var(--bg-alt)`, 4px radius, mono 12px.
- `.diagram`: mono 12px, `var(--bg-alt)`, 20px padding, 1px border, `white-space: pre`.

Callouts:

- `.info-block`: blue-tinted, 8px radius, 13px.
- `.warn-block`: amber-tinted, 8px radius, 13px.
- Use callouts sparingly for decisions, risks, warnings, or constraints.

## Content Order

Preferred section order for planning/report HTML:

1. Overview or executive summary
2. Decisions and current status
3. Scope and ownership
4. Architecture or workflow
5. Data/API/interfaces when relevant
6. Risks and tradeoffs
7. Milestones or roadmap
8. Next actions
9. Appendix/reference details

Adapt labels to the domain, but keep the document-navigation shape.

## File Placement

- Scope owns location. Put a report under the folder it belongs to.
- Folder/domain-specific HTML belongs inside that folder, not in a global catch-all.
- Parent folders keep only an index of child report topics so agents/users can discover what exists below.
- Final user-facing reports use `<scope>/report/<topic>/`.
- Report folders should keep `latest.html` and `source.md`.
- Older versions go under that report's `archive/`.
- Temporary one-off HTML files may be created at the user-requested location only when the user asks for that.

Examples:

```text
market-pulse-prod/domains/quant-serving/report/mp-core-v2/latest.html
market-pulse-prod/domains/quant-serving/report/mp-core-v2/source.md
market-pulse-prod/domains/quant-serving/report-index.md

market-pulse-prod/db/report/schema-redesign/latest.html
market-pulse-prod/db/report/schema-redesign/source.md
market-pulse-prod/db/report-index.md

market-pulse-lab/domains/quant/report/bull-v4-validation/latest.html
market-pulse-lab/domains/quant/report/bull-v4-validation/source.md
market-pulse-lab/domains/quant/report-index.md

report/workspace/repo-split/latest.html
report/workspace/repo-split/source.md
report-index.md
```

## Parent Index Rule

- If a folder contains child report folders, keep a compact `report-index.md` in that folder.
- The index lists topic name, short purpose, status, owner/scope, and link to `latest.html` or `source.md`.
- Parent indexes summarize only. Do not duplicate full report content there.
- Update the nearest parent index whenever a new current report topic is added, renamed, archived, or replaced.
- Higher-level indexes may link to lower-level indexes instead of listing every report directly.

## Content Rules

- Put decisions, tradeoffs, risks, and next actions near the top.
- Use sections for domain, DB, CI/CD, repo layout, deployment, and agent rules when relevant.
- Avoid long prose blocks; prefer tables, callouts, and short paragraphs.
- Keep enough detail that a new agent can understand the plan without reading the whole chat.
- Do not duplicate large specs inside HTML if a Markdown source already exists; link or summarize instead.
- The document should feel like a clear internal project brief, not a product landing page.

## Explicitly Forbidden

Do not use:

- marketing landing page composition
- full-width hero sections
- giant gradient header
- orb, blob, bokeh, neon, or decorative background effects
- KPI-first dashboard layout as the page frame
- top navbar instead of fixed sidebar
- card-only mosaic without document sections
- custom report CSS system unrelated to the reference
- wide two-column app shell replacing the document body
- sidebar links without matching section anchors
- HTML reports under `.agents`
- large image-led hero unless the user explicitly asks for a visual landing page

## Pre-Delivery Checklist

Before handing off an HTML report:

- Confirm it has `<nav class="sidebar">` and `<main class="main">`.
- Confirm `.main` uses `margin-left: 220px`, `padding: 40px 48px`, and `max-width: 1100px` or justified `1180px`.
- Confirm every sidebar link points to an existing section id.
- Confirm mobile media query hides sidebar and makes grids one column.
- Confirm tables and cards use the reference component classes.
- Confirm there is no dashboard hero, marketing layout, gradient/orb decoration, or unrelated CSS theme.
- Confirm `source.md`, `latest.html`, and nearest `report-index.md` are updated when this is a persistent report.
