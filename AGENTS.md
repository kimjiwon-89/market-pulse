# Market Pulse Agent Guide

Market Pulse is a full-stack stock market dashboard for Korean equities.
Backend uses KIS/KRX data; frontend shows dashboards, investor flow, memo, lotto, and quant/MP_CORE views.

## Token Budget Rule

Keep this root guide small. Do not paste domain specs here.

- Always read only the smallest relevant guide before work.
- Prefer `rg`/targeted file reads over opening whole directories.
- Put large domain/API/DB details in scoped docs, not in `AGENTS.md`.
- User-facing planning/report artifacts may be HTML when explicitly requested. Agent-readable specs/status/logs stay Markdown.

## Work Principles

- If request is ambiguous, ask before implementation.
- Surface inconsistencies and tradeoffs instead of silently choosing.
- Remove dead code introduced by your own change.
- Do not revert user changes. Current dirty files may be unrelated.
- Do not commit or work on `main` directly.

## Production / Main Deploy Guard

Agents must not deploy to production or mutate production infrastructure unless the user explicitly approves that exact action in the current message.

- Never deploy from `main` directly.
- Never push Docker images, run `/app/deploy.sh`, run `docker compose up` on EC2, copy files into `/app`, or trigger GitHub production deploy workflows without explicit approval.
- Never use `quant-model-lab` as a production deploy root. That folder is for quant research, model/backtest work, reports, and local/runtime experiments only.
- RDS writes are allowed for explicitly requested data ingestion, backfill, model-cache generation, and quant validation jobs. Keep them scoped to the requested dataset/date range/config, and report what was written.
- Do not treat RDS data writes as deployment approval. RDS data work does not authorize EC2, Docker Hub, `/app`, production compose, or app container changes.
- Read-only production checks are allowed when needed to diagnose a user-reported production state; infrastructure/app deployment write actions require approval first.
- If the user asks to "배포", "운영 반영", "서비스에 올려", or similar, restate the exact target and wait for confirmation before touching EC2, Docker Hub, GitHub Actions, or production app infrastructure.
- If the user asks to "RDS에 올려", "데이터 넣어", "백필", or similar data work, RDS writes are permitted for that data task only; do not deploy application code as part of it.
- Normal code changes must go through a feature/fix branch targeting `develop`; `develop` later goes to `main` by the agreed release process.

## Branch Rule

Use `develop` as the base.

- Feature: `feature/<name>`
- Fix: `fix/<name>`
- Refactor: `refactor/<name>`
- Docs only: `docs/<name>`
- Hotfix: `hotfix/<name>` only for urgent production fixes

All normal PRs target `develop`; `develop` later goes to `main`.

## Feature Development Pipeline

For new feature development, use:

```text
workation-planner -> user approval -> workation-back / workation-front -> workation-verifier
```

- Planner writes user HTML plan and agent spec.
- Code agents start only after user approval.
- Verifier checks acceptance criteria.
- Any verifier FAIL returns to planning.

Current Codex coordination files:

- `.Codex/status/active-plan.md`
- `.Codex/status/back-report.md`
- `.Codex/status/front-report.md`
- `.Codex/status/verify-report.md`
- `.Codex/plans/`

Legacy Claude coordination files may exist under `.claude/status/` and `.claude/plans/`; read them only when current Codex files are missing or the task explicitly references them.

## Required Context By Work Type

Read these before touching the matching area:

- Frontend: `.claude/.front/front.md` and `.claude/.front/design-guide.md`
- Backend: `.claude/.back/back.md`
- KRX API: `.claude/.krx/krx.md`
- Lotto: `.claude/.lotto/lotto-final-plan.md`
- Quant / MP_CORE / backtest: targeted docs in `.claude/quant/`

Quant quick map:

- Overall flow: `.claude/quant/06-퀀트투자-전체프로세스.md`
- Data pipeline: `.claude/quant/07-데이터와-프로그래밍.md`, `08-금융데이터-수집-기본.md`, `09-금융데이터-수집-심화.md`
- Factor selection: `.claude/quant/12-퀀트-전략을-이용한-종목선정-기본.md`, `13-퀀트-전략을-이용한-종목선정-심화.md`
- Portfolio: `.claude/quant/14-포트폴리오-구성.md`
- Backtest: `.claude/quant/15-포트폴리오-백테스트.md`
- Performance/risk: `.claude/quant/16-성과-및-위험-평가.md`
- References: `.claude/quant/17-레퍼런스.md`

## Project Layout

```text
market-pulse-api/   Spring Boot backend
market-pulse-web/   React/Vite frontend
.Codex/             current Codex plans, reports, status, logs
.claude/            detailed domain guides and legacy plans/status
scripts/            local helper scripts
```

## Run Commands

Backend:

```bash
cd market-pulse-api
./mvnw spring-boot:run
```

Frontend:

```bash
cd market-pulse-web
npm install
npm run dev
```

Useful URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`

## Backend Notes

- Java 17, Spring Boot 3.2, MyBatis, PostgreSQL, Redis.
- Common response: `ApiResponse.success(data)` and `ApiResponse.failure("message")`.
- MyBatis XML: `market-pulse-api/src/main/resources/mapper/**/*.xml`.
- KIS secrets and JWT secret must not be hard-coded for production.
- PostgreSQL numeric/json fields need explicit casts in MyBatis when source values are strings.

## Frontend Notes

- React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Recharts, Zustand, Axios.
- API client base is in `market-pulse-web/src/services/apiClient.ts`.
- Main routes live in `market-pulse-web/src/app/router.tsx`.
- Use existing layout/components before adding new patterns.

## Quant / MP_CORE Notes

- Treat MP_CORE as a reproducible pipeline: data -> feature snapshot -> signal -> portfolio target -> backtest -> diagnostics.
- Avoid look-ahead bias. Separate signal date, rebalance date, execution date, and return period.
- Backtests must include costs, turnover, MDD, win rate, monthly return, and risk-adjusted metrics.
- Current practical factors: momentum, risk-adjusted momentum, volatility, beta, liquidity, investor flow, market regime, cash/position caps.
- Value/quality/fundamental factors need point-in-time financial data before backtesting.

## Work Log

When a meaningful task finishes, append a short entry to `.Codex/.logs/YYYY-MM-DD-log.md`.

Keep logs compact:

- 3-5 bullets per task.
- Record intent, key outcome, changed files only.
- Do not paste long command output, diffs, specs, or analysis.
- Link/report detailed artifacts instead of duplicating them.

Format:

```markdown
## YYYY-MM-DD

### Task title
- Summary
- Files changed
```
