# Prod Infra Agent Rules

Read `README.md` first, then root `market-pulse-prod/AGENTS.md`.

- Infrastructure changes are high risk.
- Do not mutate production infra without explicit current-message approval.
- Do not trigger production deployment, push production images, or edit EC2 `/app` without approval.
- Prefer read-only diagnosis unless user approves exact action.


## HTML Output Guide

- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating HTML, read the nearest repo guide at `.agents/guides/html-output-style.md`.
- Use the `project-overview.html` document-dashboard style through that guide.
