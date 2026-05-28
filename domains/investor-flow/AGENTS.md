# Investor Flow Domain Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Owns foreign/institution/retail net buy-sell production behavior.
- Keep query grain explicit: date, market, asset, investor type.
- DB/index changes require reviewed migrations.
- Preserve source and collection date.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
