# Quant Model Lab Agent Guide

This folder is the working root for all quant, MP_CORE, candle-strategy, and backtest work.

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
