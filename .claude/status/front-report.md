# Frontend Report

## 로또 내 조합 인증 처리
- `/lotto`에서 비로그인 사용자가 조합 저장 시 `/login`으로 이동
- 내 조합 탭은 로그인 상태에서만 `/lotto/combo`를 호출
- 비로그인 상태에서는 로그인 안내 문구 표시

### 검증
- `npm run build` PASS
- Vite chunk size warning은 기존 번들 크기 경고로 남아 있음
- `npm run lint` FAIL: 기존 `Admin`, `Dashboard`, `IndexDetail`, `LottoDiscussion`, `NewsList`, `StockDetail` 파일의 lint 오류가 남아 있음. 이번에 수정한 `LottoAnalysis/index.tsx`의 빈 catch/any 오류는 정리됨

---

## 퀀트 수익률 개선 프론트엔드 구현 완료 보고

spec: .claude/plans/2026-05-20_quant-return-boost-spec.md
completed: 2026-05-20

### Changed Files

| File | Type | Summary |
|------|------|---------|
| market-pulse-web/src/types/index.ts | Modified | Added quant experiment run, variant, window, status, and list response types. |
| market-pulse-web/src/pages/QuantBacktest/index.tsx | Modified | Added the experiment result area below the existing quant backtest views. |
| market-pulse-web/src/pages/QuantBacktest/ExperimentPanel.tsx | Added | Loads experiment runs, shows ADMIN-only run action, polls RUNNING runs every 5 seconds, and renders selected run details. |
| market-pulse-web/src/pages/QuantBacktest/VariantTable.tsx | Added | Displays Variant, Monthly, Total, MDD, Sharpe, Turnover, Cost, Bias, Overfit, and Result columns with target-met badges. |
| market-pulse-web/src/pages/QuantBacktest/DrawdownChart.tsx | Added | Renders selected variant drawdown from its equity curve, with empty-state handling. |
| market-pulse-web/src/pages/QuantBacktest/MonthlyReturnHeatmap.tsx | Added | Converts selected variant equity curve to monthly returns and applies up/down/flat classes. |

### Implementation Summary

- `/quant` now includes the experiment result area required by AC-FE-1.
- Non-ADMIN users do not see the experiment run button; ADMIN detection uses the existing `getRole()` helper.
- RUNNING experiment runs are refreshed through `GET /api/quant/experiments/{runId}` at 5 second intervals.
- Variant rows are sorted by `targetAchieved DESC`, `overfitScore ASC`, then `monthlyReturn DESC`.
- The experiment UI avoids guarantee-style wording and uses neutral English labels.

### Verification

- `npm.cmd run build` passed.
- `npm run build` was blocked by the local PowerShell execution policy, so `npm.cmd` was used.

### Blockers / Notes

- `DrawdownChart` and `MonthlyReturnHeatmap` need `equityCurve` on variants to render chart data. If the backend omits it, both components show empty states without crashing.
- The worktree already contained unrelated modified and untracked backend/frontend files before this report was written; they were not reverted.
