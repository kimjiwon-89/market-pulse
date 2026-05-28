# Prod DB Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Prod repo owns schema.
- All schema changes go through migrations.
- Every migration must include PK/FK/unique/index/rollback/validation notes.
- Lab proposals are not applied directly.
- No production migration without explicit current-message approval.
