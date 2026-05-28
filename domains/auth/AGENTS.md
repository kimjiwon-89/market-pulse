# Auth Domain Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Owns production auth/account behavior.
- Do not weaken password, token, session, or consent handling.
- DB changes require reviewed migrations.
- Security-sensitive changes need tests and explicit risk notes.
