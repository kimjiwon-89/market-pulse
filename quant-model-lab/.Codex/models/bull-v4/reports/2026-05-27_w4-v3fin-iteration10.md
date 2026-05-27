# W4 V3-FIN 10-Iteration Improvement Report

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
cpu_limit: 0.4

## Ranking

| rank | iteration | score | pre N | train N | post N | train avg | train worst | train win | post avg | post win |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | iter01_relaxed_baseline | 107.21 | 216 | 51 | 27 | 2.41% | -2.49% | 37.25% | 7.94% | 59.26% |
| 2 | iter02_vol07 | 83.77 | 142 | 38 | 23 | 2.25% | -1.27% | 36.84% | 7.81% | 65.22% |
| 3 | iter04_ret60_40 | 76.78 | 152 | 33 | 20 | 2.31% | -2.49% | 36.36% | 10.24% | 60.00% |
| 4 | iter06_range45_ma60dist40 | 72.21 | 117 | 34 | 17 | 3.65% | -2.46% | 52.94% | 6.06% | 58.82% |
| 5 | iter10_ret60_40_range45 | 65.15 | 116 | 28 | 16 | 2.70% | -2.49% | 42.86% | 10.11% | 56.25% |
| 6 | iter03_vol10 | 61.91 | 100 | 27 | 17 | 1.91% | -1.67% | 29.63% | 9.42% | 58.82% |
| 7 | iter09_ret60_40_vol07 | 60.66 | 104 | 25 | 17 | 2.01% | -1.67% | 32.00% | 9.43% | 64.71% |
| 8 | iter07_range45_ma60dist40_vol07 | 55.63 | 70 | 24 | 14 | 3.53% | -1.23% | 54.17% | 5.83% | 64.29% |
| 9 | iter05_ret60_60 | 47.41 | 98 | 23 | 12 | -0.17% | -2.49% | 21.74% | 6.19% | 58.33% |
| 10 | iter08_top20_range45_ma60dist40_vol07 | 47.19 | 61 | 22 | 10 | 2.77% | -1.23% | 54.55% | 4.19% | 70.00% |

## Full Results

| iteration | period | avg monthly on capital | total on capital | worst month | N | win | early fail | stop |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| iter01_relaxed_baseline | pre | 0.93% | 75.17% | -5.16% | 216 | 37.96% | 53 | 57 |
| iter01_relaxed_baseline | train | 2.41% | 52.99% | -2.49% | 51 | 37.25% | 10 | 15 |
| iter01_relaxed_baseline | post | 7.94% | 55.58% | -3.21% | 27 | 59.26% | 4 | 3 |
| iter02_vol07 | pre | 0.87% | 58.83% | -5.06% | 142 | 38.03% | 30 | 44 |
| iter02_vol07 | train | 2.25% | 42.82% | -1.27% | 38 | 36.84% | 8 | 10 |
| iter02_vol07 | post | 7.81% | 54.70% | -2.58% | 23 | 65.22% | 3 | 3 |
| iter03_vol10 | pre | 0.75% | 41.32% | -3.72% | 100 | 39.00% | 19 | 31 |
| iter03_vol10 | train | 1.91% | 32.43% | -1.67% | 27 | 29.63% | 8 | 6 |
| iter03_vol10 | post | 9.42% | 47.08% | -1.35% | 17 | 58.82% | 3 | 2 |
| iter04_ret60_40 | pre | 1.09% | 69.59% | -6.29% | 152 | 36.18% | 39 | 37 |
| iter04_ret60_40 | train | 2.31% | 43.96% | -2.49% | 33 | 36.36% | 7 | 10 |
| iter04_ret60_40 | post | 10.24% | 51.22% | -3.67% | 20 | 60.00% | 3 | 3 |
| iter05_ret60_60 | pre | 0.01% | 0.58% | -5.06% | 98 | 30.61% | 27 | 27 |
| iter05_ret60_60 | train | -0.17% | -2.16% | -2.49% | 23 | 21.74% | 6 | 8 |
| iter05_ret60_60 | post | 6.19% | 24.75% | -1.81% | 12 | 58.33% | 2 | 1 |
| iter06_range45_ma60dist40 | pre | 0.95% | 59.93% | -3.09% | 117 | 39.32% | 25 | 36 |
| iter06_range45_ma60dist40 | train | 3.65% | 65.64% | -2.46% | 34 | 52.94% | 4 | 8 |
| iter06_range45_ma60dist40 | post | 6.06% | 36.39% | -2.03% | 17 | 58.82% | 2 | 2 |
| iter07_range45_ma60dist40_vol07 | pre | 0.87% | 43.58% | -3.69% | 70 | 41.43% | 10 | 26 |
| iter07_range45_ma60dist40_vol07 | train | 3.53% | 52.97% | -1.23% | 24 | 54.17% | 4 | 4 |
| iter07_range45_ma60dist40_vol07 | post | 5.83% | 34.98% | -1.40% | 14 | 64.29% | 1 | 2 |
| iter08_top20_range45_ma60dist40_vol07 | pre | 1.04% | 46.62% | -1.75% | 61 | 42.62% | 9 | 21 |
| iter08_top20_range45_ma60dist40_vol07 | train | 2.77% | 38.71% | -1.23% | 22 | 54.55% | 4 | 3 |
| iter08_top20_range45_ma60dist40_vol07 | post | 4.19% | 20.95% | -1.40% | 10 | 70.00% | 1 | 2 |
| iter09_ret60_40_vol07 | pre | 0.69% | 36.66% | -5.06% | 104 | 34.62% | 23 | 31 |
| iter09_ret60_40_vol07 | train | 2.01% | 34.12% | -1.67% | 25 | 32.00% | 6 | 7 |
| iter09_ret60_40_vol07 | post | 9.43% | 47.17% | -3.04% | 17 | 64.71% | 2 | 3 |
| iter10_ret60_40_range45 | pre | 0.75% | 43.32% | -3.20% | 116 | 34.48% | 32 | 30 |
| iter10_ret60_40_range45 | train | 2.70% | 48.63% | -2.49% | 28 | 42.86% | 5 | 8 |
| iter10_ret60_40_range45 | post | 10.11% | 50.56% | -3.72% | 16 | 56.25% | 2 | 3 |

## Readout

- Goal was 10 rounds of sample-expansion testing, not final return optimization.
- Broad relaxed variants keep the most data; compact range/MA60-distance variants improve train win rate but hurt post.
- Next improvement should target early-loser reduction without destroying post sample.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-iteration10-trades.csv`
