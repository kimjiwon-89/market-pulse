# Market Data Domain Claude Rules

Read `README.md` first, then root `market-pulse-prod/CLAUDE.md`.

- Owns production market data APIs/contracts.
- Preserve data freshness/source metadata.
- DB changes require reviewed migrations.
- Do not backfill/write RDS unless explicitly requested and scoped.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
