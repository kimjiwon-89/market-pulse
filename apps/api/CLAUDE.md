# Prod API Claude Rules

Read `README.md` first, then root `market-pulse-prod/CLAUDE.md`.

- This is production backend/API code.
- Do not change production deploy, secrets, or DB migrations without explicit approval.
- Keep API contracts stable and versioned.
- Use existing Spring Boot/MyBatis patterns.
- User-facing reports go under `report/<domain>/<topic>/`, not `.agents`.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
