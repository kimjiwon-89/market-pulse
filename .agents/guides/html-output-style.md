# HTML Output Style Guide

Use this guide whenever the user explicitly asks for an HTML planning document, guide, report, or visual summary.

## Creation Rule

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Agent-readable specs, status, logs, and working notes stay Markdown by default.
- When unsure, keep the canonical source in Markdown and ask before making HTML.

## Default Reference

Use `project-overview.html` as the default visual/structural reference.

Preferred style:

- document-dashboard layout
- strong section hierarchy
- compact summary panels
- cards for major topics only
- folder trees, responsibility tables, and workflow diagrams
- readable spacing and clear labels
- minimal decoration
- practical, scan-friendly structure over marketing-style design

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
