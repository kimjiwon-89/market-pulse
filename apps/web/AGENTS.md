# Prod Web Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- This is production frontend code.
- Keep UX consistent and dense enough for dashboard work.
- Do not create marketing/landing-only pages when user asks for usable app screens.
- API calls must use production API client patterns.
- User-facing reports go under `report/<domain>/<topic>/`, not `.agents`.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
