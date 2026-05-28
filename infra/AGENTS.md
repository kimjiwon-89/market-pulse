# Prod Infra Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Infrastructure changes are high risk.
- Do not mutate production infra without explicit current-message approval.
- Do not trigger production deployment, push production images, or edit EC2 `/app` without approval.
- Prefer read-only diagnosis unless user approves exact action.
