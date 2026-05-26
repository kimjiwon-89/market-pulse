status: W4_V3FIN_NB_EXIT_GRID_NEXT
updated: 2026-05-26
workspace_root: D:\market-pulse\quant-model-lab

## Latest Candidate

```text
V3-FIN-NB-BOTH-MA20-RISK-NEXTBODY1
```

Extended-period metrics:

- pre 2012-2022: avg monthly 13.53%, total 1145.02%, worst -12.30%, 26 trades, win 50.0%.
- train to 2025-06: avg monthly 33.34%, total 545.52%, worst -6.30%, 7 trades, win 85.7%.
- train to 2025-07: avg monthly 33.34%, total 545.52%, worst -6.30%, 7 trades, win 85.7%.
- post from 2025-07: avg monthly -2.90%, total -5.83%, worst -6.30%, 2 trades, win 50.0%.
- post from 2025-08: avg monthly -2.90%, total -5.83%, worst -6.30%, 2 trades, win 50.0%.

## Rule

- W4 filtered winner pattern.
- KOSPI and KOSDAQ both above MA20.
- Exact 5-trading-day entry delay.
- Entry confirmation: drawdown >= -5%, candle_loc >= 0.65, upper_shadow <= 0.08, body_ret >= 0%, MA20 distance >= 5%.
- Execution confirmation: next trading day's body_ret >= 1%.
- Exit: -6% early fail / -12% stop / 20-20 trail / 30 trading-day max hold.

## Code Status

- Backend candidate strategy added: `CANDLE_MTF_TREND_V3_FIN_NB`.
- Mapper query added: `findEventDrivenCandleMtfTrendNbPicks`.
- Strategy registry updated.
- Tests/compile passed.
- Backend code still reflects prior coded candidate, not newest risk/nextbody1 research variant.

## Next Work

- Next target: push train average monthly toward 50% while keeping worst <= -12.30% and win >= 70%.
- Main lever is exit logic, not entry logic. Entry is already selective and high win.
- Test hold extension: max hold 30 -> 45/60 days with conditional extension only if trend remains alive.
- Test early_fail grace: if price dips -6% but MA20/volume/market regime remain healthy, delay cut or allow recovery/re-entry.
- Test trail variants: 20/20 baseline vs 30/20, 40/25, and MA5/MA10 breakdown trail.
- Inspect post loser `2025-09-17 코세스`: early_fail cut lost -6.30%, then +93.23% after 20 trading days and +155.16% after 60 trading days.
- If robust, update backend mapper params to stop -12%, early_fail -6%, entry MA20 distance >= 5%, next body_ret >= 1%, plus final exit rule.
- Optimize backend mapper SQL before full DB/API smoke; previous full-range API smoke timed out.
