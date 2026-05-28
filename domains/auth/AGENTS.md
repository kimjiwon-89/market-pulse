# Auth Domain Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Owns production auth/account behavior.
- Do not weaken password, token, session, or consent handling.
- DB changes require reviewed migrations.
- Security-sensitive changes need tests and explicit risk notes.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
