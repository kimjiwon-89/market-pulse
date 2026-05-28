# Prod DB Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Prod repo owns schema.
- All schema changes go through migrations.
- Every migration must include PK/FK/unique/index/rollback/validation notes.
- Lab proposals are not applied directly.
- No production migration without explicit current-message approval.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
