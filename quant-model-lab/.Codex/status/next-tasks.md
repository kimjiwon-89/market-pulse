## Next Tasks

date: 2026-05-26
status: W4_V3FIN_NB_EXIT_GRID_NEXT

### Current Candidate

```text
V3-FIN-NB-BOTH-MA20-RISK-NEXTBODY1
```

Rule:

- Candidate: W4 filtered winner pattern.
- Filter: `range20 0.25~0.55`, `ret60 >= 0.20`, `ma60_dist > 0.05`, price above MA20/MA60, `vol_exp <= 3.0`, positive MA20/MA60 slope, `candle_loc >= 0.45`, `upper_shadow <= 0.08`, `trade_amount >= 500M`.
- Score: `range20 + ret60 + ma60_dist`.
- Top fallback: top10.
- Cadence: every 5 trading days, non-overlap.
- Market regime: KOSPI and KOSDAQ both above MA20.
- Entry delay: exactly 5 trading days.
- Entry confirmation: drawdown >= -5%, candle_loc >= 0.65, upper_shadow <= 0.08, body_ret >= 0%.
- Extra risk/entry filter: entry MA20 distance >= 5%.
- Execution confirmation: next trading day's body_ret >= 1% before execution.
- Exit: stop -12%, early_fail -6%/3d, trail start +20%, trail 20%, max hold 30d.

### Extended-Period Result

| split | avg monthly | total | worst | N | win | early fail |
|---|---:|---:|---:|---:|---:|---:|
| pre 2012-2022 | +13.53% | +1145.02% | -12.30% | 26 | 50.0% | 5 |
| train to 2025-06 | +33.34% | +545.52% | -6.30% | 7 | 85.7% | 1 |
| train to 2025-07 | +33.34% | +545.52% | -6.30% | 7 | 85.7% | 1 |
| post from 2025-07 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 |
| post from 2025-08 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 |

### Code Status

- Added backend strategy: `CANDLE_MTF_TREND_V3_FIN_NB`.
- Added mapper method: `findEventDrivenCandleMtfTrendNbPicks`.
- Added strategy registry entry.
- Mapper now computes features from `market_daily_price`, not `quant_candle_feature_snapshot`.
- Verification passed:
  - `./mvnw.cmd -q -Dtest=CandleTrendStrategyTest test`
  - XML parse
  - `./mvnw.cmd -q -DskipTests compile`
- Backend code still reflects the previous coded variant; newest risk/nextbody1 variant is research-only pending one more robustness pass.

### Next Work

1. Run exit grid for 50% target:
   - max hold 30/45/60.
   - trail 20/20, 30/20, 40/25, MA5/MA10 breakdown.
   - early_fail grace when MA20/volume/market regime remain healthy.
2. Compare against guardrails: train avg monthly >= 40% first, then 50%; worst <= -12.30%; win >= 70%; pre positive.
3. Inspect post loser `2025-09-17 코세스`: early_fail -6.30% then +93.23% after 20 trading days and +155.16% after 60 trading days.
4. If robust, update backend mapper params to stop -12%, early_fail -6%, entry MA20 distance >= 5%, next body_ret >= 1%, plus final exit rule.
5. Optimize backend mapper SQL before full DB/API smoke; previous full-range API smoke timed out.

### Artifacts

- Regime fix report: `.Codex/reports/2026-05-26_w4-v3fin-regime-fix.md`
- Robustness report: `.Codex/reports/2026-05-26_w4-v3fin-robustness.md`
- Risk grid report: `.Codex/reports/2026-05-26_w4-v3fin-risk-grid.md`
- Entry timing grid report: `.Codex/reports/2026-05-26_w4-v3fin-entry-timing-grid.md`
- Post-exit path CSV: `.Codex/reports/2026-05-26_w4-v3fin-entry-post-exit-path.csv`
- Backend files changed under `../market-pulse-api`.
