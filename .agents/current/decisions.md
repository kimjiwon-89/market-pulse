# Prod Decisions

Date: 2026-05-28

- Prod owns production app code, DB schema, migrations, CI/CD, accepted model serving, auth, and operations.
- Lab proposals are accepted only through prod review and implementation.
- Production deploy/infra mutation requires explicit current-message approval.
- User-facing reports belong under `report/<domain>/<topic>/`.
- Local-only DB dump is ignored by git and used for local development only.
