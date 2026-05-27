## 2026-05-26 Candle Oracle Cross-Period Analysis

Goal: find chart/candle patterns from the fixed train period, then check whether they appear in other periods before adding more strategy rules.

Data:

- Source: `market_daily_price`
- `quant_candle_feature_snapshot` is empty in the current local DB, so this analysis computed candle features directly from daily OHLCV.
- Tradable filter: market cap >= 30B KRW, trade amount >= 500M KRW, close >= 1,000 KRW.
- Periods:
  - pre: 2020-01-01 ~ 2022-04-30
  - train: 2022-05-01 ~ 2025-06-30
  - post: 2025-07-01 ~ 2026-05-20
- Oracle target: max high return within 40 trading days after next-day entry.

## Main Findings

- `range20` is the strongest cross-period candle signal. Higher 20-day range means higher 40-day max-return hit rate in all periods.
- Low `high60_ratio` works better than high-breakout positioning. The biggest winners often begin below the prior 60-day high, not at fresh highs.
- `ret20` and `ret60` are U-shaped. Very weak and very strong momentum buckets both produce more large winners than middle buckets.
- `candle_location` is weak. Close position inside the candle does not separate winners well.
- Current breakout-style rule is stable but lower-upside than high-range / low-high-ratio candidates.

## Rule Probe

| Rule | Period | Count | Avg Max40 | Pct >= 50% | Pct >= 100% | Avg Close20 | Avg Close40 |
|---|---|---:|---:|---:|---:|---:|---:|
| R2 low high60 + high range | pre | 153,545 | 33.17% | 19.78% | 5.33% | 4.45% | 7.57% |
| R2 low high60 + high range | train | 178,352 | 24.99% | 12.15% | 2.46% | -0.92% | -1.69% |
| R2 low high60 + high range | post | 18,745 | 33.53% | 18.27% | 7.66% | -0.46% | -3.02% |
| R3 extreme ret20 + high range | pre | 263,521 | 30.55% | 17.57% | 4.60% | 2.79% | 4.83% |
| R3 extreme ret20 + high range | train | 283,846 | 24.94% | 12.23% | 2.69% | -0.86% | -1.62% |
| R3 extreme ret20 + high range | post | 39,164 | 34.69% | 19.93% | 7.83% | 0.75% | 1.00% |
| R4 old breakout | pre | 19,545 | 23.41% | 10.65% | 2.27% | 1.86% | 2.72% |
| R4 old breakout | train | 19,799 | 22.05% | 10.08% | 2.12% | 1.34% | 2.11% |
| R4 old breakout | post | 3,902 | 28.75% | 15.48% | 5.05% | 1.52% | 3.08% |

## Peak Timing

For candidates that eventually reached at least +50% within 40 trading days:

| Rule | Period | Winners | Avg Peak Day | Peak <= 5d | Peak <= 10d | Peak <= 20d |
|---|---|---:|---:|---:|---:|---:|
| R2 | pre | 5,000 | 29.87 | 0.54% | 3.86% | 18.54% |
| R2 | train | 5,000 | 27.86 | 1.50% | 7.92% | 25.70% |
| R2 | post | 3,425 | 24.63 | 6.19% | 14.34% | 31.53% |
| R3 | pre | 5,000 | 29.57 | 0.56% | 4.12% | 18.38% |
| R3 | train | 5,000 | 28.78 | 0.86% | 5.44% | 21.86% |
| R3 | post | 5,000 | 25.51 | 5.06% | 13.20% | 30.78% |
| R4 old breakout | pre | 2,081 | 27.02 | 2.26% | 9.18% | 29.65% |
| R4 old breakout | train | 1,995 | 30.13 | 1.20% | 5.11% | 17.44% |
| R4 old breakout | post | 604 | 23.70 | 5.46% | 17.72% | 42.72% |

## Strategy Implications

- Do not rely on fixed 10-day profit taking for big winners. Most +50% winners peak after 20 trading days.
- Do not hold blindly to 40 days either. Train-period close20/close40 is often negative despite high max40 potential, so the edge is in spike capture and trailing exit.
- Next model candidate should test a high-range rebound/breakout family:
  - entry pool: `range20 > 0.30`, `high60_ratio < 0.80`
  - alternate pool: `(ret20 < -0.07 OR ret20 > 0.12)`, `range20 > 0.25`
  - exit: hold up to 40 days, but trail from peak after +20% or +30%, and cut on MA20 loss / distribution candle.

## Next Tests

1. Build a daily path retest for R2 and R3 with trailing exits.
2. Compare against old breakout R4 on pre/train/post.
3. Optimize on train only, then freeze rules and score on pre/post.

## 2026-05-26 Current Train Max Profit Scan

Command rerun:

- `.\mvnw.cmd -q -Dtest=CandleTrendStrategyTest test`: PASS
- Oracle scan source: `market_daily_price`
- Train period: 2022-05-01 ~ 2025-06-30
- Tradable filter: market cap >= 30B KRW, trade amount >= 500M KRW, close >= 1,000 KRW
- Oracle path: next-day open entry, max high within 40 trading days

Raw top intervals:

| Signal | Entry | Peak | Peak Day | Code | Name | Max Return | ret20 | ret60 | high60 ratio | range20 | vol exp |
|---|---|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| 2023-04-24 | 2023-04-25 | 2023-05-16 | 14 | 001440 | 대한전선 | 994.13% | 10.55% | -0.82% | 0.879 | 0.253 | 4.49 |
| 2023-03-16 | 2023-03-17 | 2023-04-19 | 24 | 131400 | 이브이첨단소재 | 993.48% | -2.01% | 68.84% | 0.685 | 0.525 | 2.79 |
| 2024-08-22 | 2024-08-23 | 2024-10-04 | 26 | 071950 | 코아스 | 986.71% | 0.78% | 108.85% | 0.786 | 0.405 | 0.38 |
| 2023-03-15 | 2023-03-16 | 2023-04-19 | 25 | 131400 | 이브이첨단소재 | 983.49% | -2.53% | 73.98% | 0.706 | 0.509 | 2.79 |
| 2024-08-13 | 2024-08-14 | 2024-10-04 | 32 | 071950 | 코아스 | 974.29% | 11.35% | 119.67% | 0.875 | 0.250 | 0.52 |

Best opportunity months:

| Month | Best Max Return | Top10 Avg Max Return | >=50% hits | >=100% hits |
|---|---:|---:|---:|---:|
| 2023-04 | 994.13% | 882.03% | 1,977 | 398 |
| 2023-03 | 993.48% | 945.07% | 3,411 | 953 |
| 2024-08 | 986.71% | 688.45% | 1,458 | 245 |
| 2023-02 | 971.08% | 686.42% | 3,032 | 976 |
| 2023-06 | 913.87% | 806.38% | 2,660 | 731 |

Rule maxima on train:

| Rule | Count | Avg Max40 | Max Max40 | >=50% hits | >=100% hits |
|---|---:|---:|---:|---:|---:|
| R2 low `high60_ratio`, high `range20` | 178,392 | 25.14% | 993.48% | 21,705 | 4,430 |
| R3 extreme `ret20`, high `range20` | 283,900 | 25.06% | 913.48% | 34,771 | 7,702 |
| R4 old breakout | 19,807 | 22.30% | 889.47% | 2,003 | 427 |
| R7 low `high60_ratio`, high `range20`, high volume expansion | 54,976 | 24.07% | 993.48% | 6,309 | 1,392 |

Notes:

- Raw oracle maximum is concentrated around 2023-02 ~ 2023-04 and 2024-08.
- Several +900% rows may include corporate-action, adjustment, or data-quality effects. Before model promotion, add a raw-data sanity filter for suspicious adjusted-price jumps.
- Pattern still agrees with cross-period finding: high `range20` plus lower `high60_ratio` captures more max-return opportunity than old breakout.
