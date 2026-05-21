## Frontend Rework Report

spec: `.Codex/plans/2026-05-21_quant-mp-core-frontend-spec.md`
completed: 2026-05-21

### Changed Files
- `market-pulse-web/src/types/index.ts`
- `market-pulse-web/src/pages/QuantDashboard/CandidateDrilldown.tsx`
- `market-pulse-web/src/pages/QuantDashboard/BacktestEvidencePanel.tsx`
- `market-pulse-web/src/pages/QuantDashboard/PortfolioTargetPanel.tsx`
- `market-pulse-web/src/pages/QuantDashboard/DiagnosticsPanel.tsx`
- `market-pulse-web/src/pages/QuantDashboard/RunControlPanel.tsx`

### Implemented
- `CandidateDrilldown` now renders `candidate.rebalanceStatus`, not `candidate.signalState`, for rebalance status.
- Backtest panel reads top-level `monthlyReturn`, `mdd`, `sharpe`, `winRate`, `totalCost`; it also renders equity curve, drawdown chart, monthly heatmap, and cost summary from the aligned contract.
- Portfolio target panel reads `portfolio.positions`.
- Diagnostics panel renders map-shaped diagnostics with `Object.entries`.
- Run control backtest POST body is `{ strategyId, from, to, initialCash }`; `modelCode` was removed.

### Verification
- `market-pulse-web`: `npm.cmd run build` passed.
- Vite emitted the existing large chunk warning.
