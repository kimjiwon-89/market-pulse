# Quant Model Lab Agent Guide

This folder is the working root for all quant, MP_CORE, candle-strategy, and backtest work.

## Hard Deployment Ban

This folder is not a production deploy root.

- Do not deploy from `quant-model-lab`.
- Do not deploy to `main`.
- Do not push Docker images, run EC2 `/app/deploy.sh`, run remote `docker compose up`, copy files into EC2 `/app`, or trigger production GitHub Actions from this folder.
- RDS writes are allowed for explicitly requested data ingestion, backfill, model-cache generation, and quant validation jobs. Keep them scoped to the requested dataset/date range/config, and report what was written.
- Do not treat RDS data writes as deployment approval. RDS work from this folder must not change EC2 `/app`, Docker images, production compose files, production containers, or GitHub deploy workflows.
- Do not convert quant model versioning requests into app/API/web version changes.
- Quant model versions such as `Bull 5.0.0` belong to model metadata/configs/backtest artifacts, not application release versions.
- If production verification is needed, prefer read-only checks. Any write to EC2, Docker Hub, `/app`, production compose files, or production containers must stop and ask first.

## Scope Rule

- Treat `D:\market-pulse\quant-model-lab` as the root for quant work.
- Write plans, reports, status, logs, CSV outputs, and analysis artifacts under this folder only.
- Use `.Codex/` in this folder for Codex coordination:
  - `.Codex/status/`
  - `.Codex/reports/`
  - `.Codex/plans/`
  - `.Codex/.logs/`
- Do not read or write `D:\market-pulse\.Codex` for quant work unless the user explicitly asks for old parent artifacts.
- Prefer targeted reads inside this folder. Avoid scanning the parent repo broadly.

## Code Access

- Source files may still live in the main app folders. Use the pointer files in this folder to locate them:
  - `backend-quant`
  - `backend-quant-mappers`
  - `backend-quant-tests`
  - `frontend-quant-dashboard`
  - `frontend-quant-backtest`
- Keep generated quant research outputs in this folder, not beside the app root.

## Quant Rules

- Avoid look-ahead bias.
- Keep signal date, rebalance date, execution date, and return period separate.
- Backtests must include costs, trade count, win rate, monthly return, worst month or MDD, and turnover when available.
- Change one variable family at a time and record each meaningful result.

## Current Focus

- Goal: reach and validate average monthly return >= 15%.
- Latest candidate: filtered W4 + `range20 <= 0.55` + entry-date candle confirmation.
- Next validation: entry delay sensitivity, top fallback sensitivity, post sample expansion, and pre worst-month reduction.
