status: W4_V3FIN_NB_EXIT_GRID_46PCT_FOUND
updated: 2026-05-26
workspace_root: D:\market-pulse\quant-model-lab

## Latest Candidate

```text
V3-FIN-NB-BOTH-MA20-RISK-NEXTBODY1-COND-EXT60
```

Baseline metrics:

- pre 2012-2022: avg monthly 13.53%, total 1145.02%, worst -12.30%, 26 trades, win 50.0%.
- train to 2025-07: avg monthly 33.34%, total 545.52%, worst -6.30%, 7 trades, win 85.7%.
- post from 2025-08: avg monthly -2.90%, total -5.83%, worst -6.30%, 2 trades, win 50.0%.

Best exit-grid candidate `cond_ext60_ret25_t20`:

- Rule: at day 30, extend to max 60 only if return >=25% and close > MA20; during extension use 20% peak trailing.
- pre 2012-2022: avg monthly 13.01%, worst -12.30%.
- train to 2025-07: avg monthly 46.09%, total 978.28%, worst -6.30%, 7 trades, win 85.7%.
- post from 2025-07: avg monthly -2.90%, total -5.83%, worst -6.30%, 2 trades, win 50.0%.

## Rule

- W4 filtered winner pattern.
- KOSPI and KOSDAQ both above MA20.
- Exact 5-trading-day entry delay.
- Entry confirmation: drawdown >= -5%, candle_loc >= 0.65, upper_shadow <= 0.08, body_ret >= 0%, MA20 distance >= 5%.
- Execution confirmation: next trading day's body_ret >= 1%.
- Exit baseline: -6% early fail / -12% stop / 20-20 trail / 30 trading-day max hold.
- Exit-grid best: conditional extension to 60 days if day-30 return >=25% and close > MA20, then 20% peak trailing.

## Code Status

- Backend candidate strategy added: `CANDLE_MTF_TREND_V3_FIN_NB`.
- Mapper query added: `findEventDrivenCandleMtfTrendNbPicks`.
- Strategy registry updated.
- Tests/compile passed.
- Backend code still reflects prior coded candidate, not newest risk/nextbody1/conditional-extension research variant.

## Next Work

- Close gap from 46.09% to 50% while keeping worst <= -12.30% and win >= 70%.
- Tune day-30 extension threshold 20/25/30% and extension trail 15/20/25%.
- Test extension only if MA20 slope and volume remain healthy.
- Inspect post loser `2025-09-17 코세스`: early_fail cut lost -6.30%, then +93.23% after 20 trading days and +155.16% after 60 trading days.
- If robust, update backend mapper params to stop -12%, early_fail -6%, entry MA20 distance >= 5%, next body_ret >= 1%, plus conditional extension exit rule.
- Optimize backend mapper SQL before full DB/API smoke; previous full-range API smoke timed out.
