# Frontend Report

## 범용 메모 UI
- `/memo` 페이지를 신규 `/api/memo` 기반 필터 리스트로 전환
- 기능, 날짜 범위, 시장, 종목코드, 키워드 필터 지원
- `/net-buy` 종목 모달에서 해당 날짜/시장/종목 메모 여러 개 조회/추가/삭제 지원
- `/net-buy` 하단 날짜+시장 메모도 신규 다중 메모 구조로 전환
- `/investor` 투자자 동향 메모도 신규 다중 메모 구조로 전환

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
