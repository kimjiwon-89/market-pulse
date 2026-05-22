# Market Pulse Claude Guide

This file intentionally mirrors `AGENTS.md` in compact form.
Keep it small to avoid repeated context cost. Put domain details in scoped docs.

## Core Rules

- Ask when ambiguous.
- Surface tradeoffs and inconsistencies.
- Do not revert user changes.
- Do not work or commit directly on `main`.
- Use `develop` as base.
- Docs-only branches use `docs/<name>`.
- User-facing plans/reports can be HTML when explicitly requested; agent-readable specs/status/logs stay Markdown.

## Feature Pipeline

For new feature development:

```text
workation-planner -> user approval -> workation-back / workation-front -> workation-verifier
```

Current Codex files are under `.Codex/`. Legacy Claude files are under `.claude/`.

## Read Before Work

- Frontend: `.claude/.front/front.md`, `.claude/.front/design-guide.md`
- Backend: `.claude/.back/back.md`
- KRX: `.claude/.krx/krx.md`
- Lotto: `.claude/.lotto/lotto-final-plan.md`
- Quant/MP_CORE: targeted docs in `.claude/quant/`

Quant key docs:

- `06-퀀트투자-전체프로세스.md`
- `07-데이터와-프로그래밍.md`
- `08-금융데이터-수집-기본.md`
- `09-금융데이터-수집-심화.md`
- `12-퀀트-전략을-이용한-종목선정-기본.md`
- `13-퀀트-전략을-이용한-종목선정-심화.md`
- `14-포트폴리오-구성.md`
- `15-포트폴리오-백테스트.md`
- `16-성과-및-위험-평가.md`
- `17-레퍼런스.md`

## Project

```text
market-pulse-api/   Spring Boot backend
market-pulse-web/   React/Vite frontend
.Codex/             current Codex plans, reports, status, logs
.claude/            detailed domain guides and legacy plans/status
```

## Run

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

## Short Technical Reminders

- Backend: Java 17, Spring Boot 3.2, MyBatis, PostgreSQL, Redis.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4.
- Use `ApiResponse.failure()`, not `error()`.
- MyBatis XML path: `market-pulse-api/src/main/resources/mapper/**/*.xml`.
- MP_CORE must avoid look-ahead bias and separate signal/rebalance/execution dates.
- Backtests need costs, turnover, MDD, win rate, monthly return, and risk metrics.

## Logs

Append meaningful completed work to `.Codex/.logs/YYYY-MM-DD-log.md`.
Keep entries compact: intent, outcome, changed files. Do not paste long command output, diffs, specs, or analysis.
