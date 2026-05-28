# Market Pulse Prod Agent Rules

This file is for AI operating rules inside `market-pulse-prod`.

Project overview, layout, run commands, and service notes live in `README.md`.

## Required Read Order

Before work:

1. `README.md`
2. `docs/architecture/feature-scope.md` for feature-scope or domain-boundary work
3. `docs/architecture/database-redesign.md` for DB/schema/index/migration work
4. smallest relevant domain guide
5. current status/plan only if task needs it

Do not recursively read archives or historical reports unless user asks for history.

## Default Modes

- Superpowers: use relevant workflow skill before planning, debugging, implementing, or verifying.
- Cavecrew: use for compact investigation, small scoped edits, and compressed review when delegation helps.
- Caveman: use `full` style for user-facing chat by default. Terse, technical, low-token, no filler.
- PM kit: when user asks for planning, PRD, implementation plan, wireframe, or dashboard requirements, use `/pm-kit` style workflow.
- Drop Caveman only for safety/clarity: destructive actions, security warnings, production deploy, infra mutation, or ambiguous multi-step instructions. Resume after.

## Production Safety

- This repo owns production service code, but agents still cannot deploy or mutate production infra without explicit current-message approval.
- Never deploy from `main` directly.
- Never push production Docker images, run production deploy scripts, copy files into `/app`, trigger production GitHub workflows, or change EC2/Docker Hub/prod compose without explicit approval.
- Production DB schema changes must go through reviewed migrations.
- RDS writes are allowed only for explicitly requested ingestion, backfill, model-cache generation, or validation jobs.
- RDS data work does not authorize app deployment.
- If user says "배포", "?�영 반영", "?�비?�에 ?�려", restate exact target and wait for confirmation before touching production infra.

## Branch Rules

Use:

```text
feature/<name>
fix/<name>
refactor/<name>
docs/<name>
hotfix/<name>    # urgent production fixes only
```

Normal PRs target `develop`. `develop` promotes to `main` through release PR and release tag.

## DB And Migration Rules

- Prod repo is source of truth for DB schema.
- DB redesign baseline lives in `docs/architecture/database-redesign.md`.
- Production feature scope lives in `docs/architecture/feature-scope.md`.
- Lab may propose migrations; prod reviews and implements accepted migrations.
- Every migration must define PK, FK, unique constraints, indexes, rollback expectation, and validation query.
- Use PostgreSQL identity columns for entity IDs unless a natural/composite key is better.
- Do not create ad hoc schema changes outside migration files.

## Artifact Rules

- Do not create planning documents unless user explicitly asks or an approved workflow requires one.
- Do not create HTML unless user explicitly asks, or the plan is complete and user-facing delivery is requested.
- Agent-readable specs, status, and logs stay Markdown.
- Prefer editing canonical/current files over creating new dated copies.
- Keep only one current version of each plan/status/report source.
- If a new plan/status/report replaces an old current file, move the old one to archive immediately.
- If a current file is merely edited in place, do not archive it.
- User-facing final reports belong under `report/<domain>/<topic>/`, not inside `.agents`.
- A user-facing report folder should keep `latest.html` and `source.md`; older versions go under that report's `archive/`.
- `.agents` is for AI working memory only: current status, decisions, next actions, logs, and legacy archives.
- Do not put final user-facing HTML reports in `.agents`.
- Keep logs compact.

## Domain Context Rules

When working inside a domain folder:

- Treat it as one production domain, not the whole product.
- Read local `AGENTS.md`/`CLAUDE.md` if present.
- Read root `README.md` before architecture decisions.
- Domain rules never override root production safety rules.

## Work Log

When meaningful work finishes, append compact entry to the repo's current log location.

Keep logs to 3-5 bullets:

- intent
- key outcome
- changed files


## Recursive Scope

- These rules apply to this directory and every descendant folder, including the smallest leaf folders, unless a deeper `AGENTS.md` or `CLAUDE.md` adds stricter local rules.
- Deeper local rules may add domain-specific detail, but they must not weaken root safety, artifact, guide-authoring, or HTML-output rules.
- If a descendant folder has no local agent file, inherit the nearest parent `AGENTS.md`/`CLAUDE.md` rules exactly.
- For any HTML report created anywhere under `D:\market-pulse`, use the synchronized `html-output-style.md` contract unless the user explicitly requests a different style in the current task.
## Guide Authoring Rules
- When creating or updating any agent guide, write it as a strict contract, not a loose preference note.
- Specify exact paths, required references, read order, output locations, class/file names, layout numbers, tokens, required checks, and forbidden patterns whenever they apply.
- Do not rely on vague style words like `similar`, `roughly`, `clean`, or `dashboard-like` unless concrete examples and measurable rules are included.
- If a reference file exists, name the exact file path and list what must be copied from it.
- Agents must follow written guides exactly and must not reinterpret or deviate unless the user explicitly asks for a different rule in the current task.
- If the user asks to make a new preference permanent, update the relevant guide and all affected agent entrypoints in the same task.
## HTML Output Guide
- Do not create HTML unless the user explicitly asks for HTML, or the user-facing plan/report is complete and the user requests an HTML deliverable.
- Before creating or editing any HTML report, read `D:\market-pulse\.agents\guides\html-output-style.md` and follow it as a strict contract.
- Use `D:\market-pulse\report\rebuild\master-plan\archive\project-overview.html` as the required visual/structural reference.
- Required default format: fixed 220px sidebar, `main.main` document body, section anchors, 1100px content width, compact cards/tables, and project-document navigation.
- Do not use marketing heroes, full dashboard shells, wide KPI-first layouts, gradient/orb decoration, or unrelated custom CSS systems unless the user explicitly asks for a different style.