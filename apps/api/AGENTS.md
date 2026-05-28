# Prod API Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- This is production backend/API code.
- Do not change production deploy, secrets, or DB migrations without explicit approval.
- Keep API contracts stable and versioned.
- Use existing Spring Boot/MyBatis patterns.
- User-facing reports go under `report/<domain>/<topic>/`, not `.agents`.
