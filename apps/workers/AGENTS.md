# Prod Workers Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Workers are production batch/background jobs.
- Do not run jobs against production data without explicit scoped request.
- Record data date, source, and affected row counts for data jobs.
- DB schema changes still belong in `db/migrations`.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
