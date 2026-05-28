# Quant Serving Domain Claude Rules

Read `README.md` first, then root `market-pulse-prod/CLAUDE.md`.

- Serves accepted production quant models only.
- Do not run lab experiments here.
- Model changes require lab validation package and prod acceptance.
- Include rollback/kill-switch considerations.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
