# Candle Test Brief

goal: chart-only trend model monthly compound >= 1.0%
stop rule: if context/token budget feels near final 10%, stop testing and leave next-task handoff

## Current Facts

- Period: 2022-05-01 ~ 2025-06-30
- Signal: prior monthly OHLCV snapshot
- Entry: next month first trading day
- Baseline exit: same month last trading day
- Universe: local `market_daily_price` STOCK rows
- New candle models do not use MP_CORE rules or `quant_core_feature_snapshot`

## Current Result

| Strategy | Monthly | Total | MDD |
|---|---:|---:|---:|
| MP_CORE_SIGNAL | 0.54% | 22.60% | -57.77% |
| CANDLE_BREAKOUT_V1 | -4.10% | -79.63% | -82.37% |
| CANDLE_PULLBACK_V1 | -2.77% | -65.68% | -70.24% |

## Next Test

- Focus pullback first.
- Test hold days: 5, 10, 15, 20, month.
- Test tighter drawdown bands.
- Test topN 3, 5, 10.
- If any variant nears 1%, implement that variant.

## Latest

- Best pullback: `pb_h10_t5_dd3_10`
  - Monthly: -0.12%
  - Total: -4.30%
  - MDD: -18.85%
- Best chart momentum: `mom_h20_t5`
  - Rule: near 60d high 95%, ret20 >= 5%, ret60 >= 15%, volume expansion >= 0.8, range20 <= 12%, hold 20 trading days, top 5.
  - Monthly: 1.02%
  - Total: 47.29%
  - MDD: -28.38%
  - Active months: 30 / 38
- Implemented as `CANDLE_MOMENTUM_H20_V1`.

## 5pct Target Test

- Goal tested: average monthly return >= 5%.
- Honest basis: 38 months, no-trade months counted as cash 0%.
- Stop-loss grid was too strict:
  - Most variants traded only 0-2 months.
  - Best stop-loss variant stayed negative.
- Focused momentum grid result:
  - Best: `base_h20_t5`
  - Average monthly: 1.38%
  - Monthly compound: 1.09%
  - Total: 50.88%
  - MDD: -28.38%
  - Losing month ratio: 39.47%
  - Losing pick ratio: 41.93%
- Verdict: no 5% average monthly candidate found without look-ahead or unrealistic exit assumptions.

## Profit/Loss Exit Retest

- Tested take-profit / stop-loss overlays on the H20 momentum family.
- Conservative assumption: if stop and take-profit touch on same day, stop wins.
- Best overlay:
  - `h20_t5_base_tp20_s10`
  - Average monthly: 0.80%
  - Monthly compound: 0.54%
  - Total: 22.57%
  - MDD: -24.39%
- Verdict:
  - Exit overlay reduced drawdown a bit.
  - It also cut off large winners.
  - It did not improve toward the 5% target.
  - Current best remains no hard take-profit, H20 momentum top 5.

## Next Direction

- Need daily/weekly signal cadence, not monthly-only entry.
- Need real stop/trailing-stop simulation with intraperiod order assumptions.
- Need market regime data; cash in weak index regimes.
- Need separate high-conviction mode; current monthly snapshot has too few clean 5% opportunities.
