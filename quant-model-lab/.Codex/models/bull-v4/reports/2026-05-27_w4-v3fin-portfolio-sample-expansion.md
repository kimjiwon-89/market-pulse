# W4 V3-FIN Portfolio Sample Expansion

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
max_positions: 10
max_buys_per_day: 5
liquidity_cap: 3.0% of signal-day trade amount

## Ranking For Sample Expansion

| rank | variant | score | pre N | train N | post N | train avg | train worst | train win | post avg |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | relaxed_d5_loc55_ma2_nb0_top50 | 87.35 | 216 | 51 | 16 | 2.41% | -2.49% | 37.25% | 16.47% |
| 2 | relaxed_vol07_top50 | 64.56 | 142 | 38 | 13 | 2.25% | -1.27% | 36.84% | 15.66% |
| 3 | current_entry_top20 | 61.27 | 155 | 34 | 13 | 2.17% | -2.46% | 44.12% | 16.75% |
| 4 | relaxed_ret60_40_top50 | 60.96 | 152 | 33 | 14 | 2.31% | -2.49% | 36.36% | 20.31% |
| 5 | relaxed_range45_ma60dist40_top50 | 51.47 | 117 | 34 | 7 | 3.65% | -2.46% | 52.94% | -0.32% |
| 6 | relaxed_ret60_40_vol07_top50 | 45.57 | 104 | 25 | 11 | 2.01% | -1.67% | 32.00% | 19.29% |
| 7 | relaxed_vol10_top50 | 44.17 | 100 | 27 | 8 | 1.91% | -1.67% | 29.63% | 23.75% |
| 8 | relaxed_rank20_range45_ma60dist40_vol07 | 33.48 | 61 | 22 | 6 | 2.77% | -1.23% | 54.55% | -0.16% |

## Full Result

| variant | period | avg monthly on capital | total on capital | worst month | N | win | early fail | stop |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| relaxed_d5_loc55_ma2_nb0_top50 | pre | 0.93% | 75.17% | -5.16% | 216 | 37.96% | 53 | 57 |
| relaxed_d5_loc55_ma2_nb0_top50 | train | 2.41% | 52.99% | -2.49% | 51 | 37.25% | 10 | 15 |
| relaxed_d5_loc55_ma2_nb0_top50 | post | 16.47% | 82.34% | -3.21% | 16 | 62.50% | 2 | 3 |
| relaxed_ret60_40_top50 | pre | 1.09% | 69.59% | -6.29% | 152 | 36.18% | 39 | 37 |
| relaxed_ret60_40_top50 | train | 2.31% | 43.96% | -2.49% | 33 | 36.36% | 7 | 10 |
| relaxed_ret60_40_top50 | post | 20.31% | 81.23% | -3.67% | 14 | 57.14% | 2 | 3 |
| relaxed_vol07_top50 | pre | 0.87% | 58.83% | -5.06% | 142 | 38.03% | 30 | 44 |
| relaxed_vol07_top50 | train | 2.25% | 42.82% | -1.27% | 38 | 36.84% | 8 | 10 |
| relaxed_vol07_top50 | post | 15.66% | 78.29% | -2.58% | 13 | 69.23% | 1 | 3 |
| relaxed_vol10_top50 | pre | 0.75% | 41.32% | -3.72% | 100 | 39.00% | 19 | 31 |
| relaxed_vol10_top50 | train | 1.91% | 32.43% | -1.67% | 27 | 29.63% | 8 | 6 |
| relaxed_vol10_top50 | post | 23.75% | 71.25% | -1.35% | 8 | 62.50% | 1 | 2 |
| relaxed_range45_ma60dist40_top50 | pre | 0.95% | 59.93% | -3.09% | 117 | 39.32% | 25 | 36 |
| relaxed_range45_ma60dist40_top50 | train | 3.65% | 65.64% | -2.46% | 34 | 52.94% | 4 | 8 |
| relaxed_range45_ma60dist40_top50 | post | -0.32% | -1.28% | -2.03% | 7 | 42.86% | 2 | 2 |
| relaxed_rank20_range45_ma60dist40_vol07 | pre | 1.04% | 46.62% | -1.75% | 61 | 42.62% | 9 | 21 |
| relaxed_rank20_range45_ma60dist40_vol07 | train | 2.77% | 38.71% | -1.23% | 22 | 54.55% | 4 | 3 |
| relaxed_rank20_range45_ma60dist40_vol07 | post | -0.16% | -0.65% | -1.40% | 6 | 50.00% | 1 | 2 |
| relaxed_ret60_40_vol07_top50 | pre | 0.69% | 36.66% | -5.06% | 104 | 34.62% | 23 | 31 |
| relaxed_ret60_40_vol07_top50 | train | 2.01% | 34.12% | -1.67% | 25 | 32.00% | 6 | 7 |
| relaxed_ret60_40_vol07_top50 | post | 19.29% | 77.18% | -3.04% | 11 | 63.64% | 1 | 3 |
| current_entry_top20 | pre | 0.91% | 62.75% | -4.35% | 155 | 40.65% | 34 | 38 |
| current_entry_top20 | train | 2.17% | 36.85% | -2.46% | 34 | 44.12% | 4 | 12 |
| current_entry_top20 | post | 16.75% | 83.75% | -1.81% | 13 | 69.23% | 1 | 2 |

## Readout

- This is sample expansion, not return optimization.
- Returns are normalized to 1B KRW capital with 100M KRW per position.
- Main success metric is trade count while keeping train/post losses tolerable.
- Trade CSV includes entry candle and future path columns for chart/timing analysis.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-portfolio-sample-expansion-trades.csv`
