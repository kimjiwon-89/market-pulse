# Prod Workers Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Workers are production batch/background jobs.
- Do not run jobs against production data without explicit scoped request.
- Record data date, source, and affected row counts for data jobs.
- DB schema changes still belong in `db/migrations`.
