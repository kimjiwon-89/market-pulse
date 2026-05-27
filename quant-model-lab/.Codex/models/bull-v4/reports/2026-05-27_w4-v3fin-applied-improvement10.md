# W4 V3-FIN Applied Improvement 10-Test Report

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
cpu_limit: 0.4
mode: apply next_body >= 1% + range20 <= 40%, then retest variants sequentially

## Ranking

| rank | test | score | train N | train avg | train worst | train win | train early | train stop | post N | post avg | post win |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | ap06_range040_next005 | 59.90 | 38 | 3.15% | -2.46% | 50.00% | 15.79% | 26.32% | 28 | 5.84% | 57.14% |
| 2 | ap05_range045_top50 | 56.67 | 35 | 3.04% | -2.46% | 48.57% | 11.43% | 34.29% | 27 | 5.60% | 51.85% |
| 3 | ap03_range040_top80 | 55.36 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 26 | 5.81% | 57.69% |
| 4 | ap02_range040_top60 | 55.32 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 26 | 5.81% | 57.69% |
| 5 | ap04_range042_top50 | 55.30 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 26 | 5.65% | 53.85% |
| 6 | ap01_range040_top50 | 55.28 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 26 | 5.81% | 57.69% |
| 7 | ap09_range040_ret60max100 | 52.61 | 29 | 4.24% | -2.46% | 58.62% | 10.34% | 27.59% | 20 | 5.92% | 60.00% |
| 8 | ap08_range040_ma60_055 | 51.68 | 31 | 3.63% | -2.46% | 54.84% | 12.90% | 29.03% | 22 | 4.64% | 59.09% |
| 9 | ap10_range040_ret60max080 | 50.45 | 26 | 4.51% | -2.46% | 61.54% | 11.54% | 26.92% | 19 | 5.73% | 57.89% |
| 10 | ap07_range040_next015 | 47.11 | 29 | 2.79% | -2.46% | 48.28% | 13.79% | 34.48% | 22 | 6.06% | 59.09% |

## Test Log

| test | intent | params | train | post |
|---|---|---|---|---|
| ap01_range040_top50 | applied improvement baseline | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=50` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=26, avg=5.81%, worst=-1.86%, win=57.69%, early=2(7.69%), stop=3(11.54%) |
| ap02_range040_top60 | recover sample by wider daily rank | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=60` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=26, avg=5.81%, worst=-1.86%, win=57.69%, early=2(7.69%), stop=3(11.54%) |
| ap03_range040_top80 | recover sample more by wider daily rank | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=80` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=26, avg=5.81%, worst=-1.86%, win=57.69%, early=2(7.69%), stop=3(11.54%) |
| ap04_range042_top50 | slightly loosen range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.42, top_n=50` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=26, avg=5.65%, worst=-1.86%, win=53.85%, early=2(7.69%), stop=4(15.38%) |
| ap05_range045_top50 | loosen range cap to old relaxed level | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.45, top_n=50` | N=35, avg=3.04%, worst=-2.46%, win=48.57%, early=4(11.43%), stop=12(34.29%) | N=27, avg=5.60%, worst=-1.86%, win=51.85%, early=2(7.41%), stop=4(14.81%) |
| ap06_range040_next005 | loosen next body to 0.5% with range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.005, range20_max=0.4, top_n=50` | N=38, avg=3.15%, worst=-2.46%, win=50.00%, early=6(15.79%), stop=10(26.32%) | N=28, avg=5.84%, worst=-2.63%, win=57.14%, early=2(7.14%), stop=4(14.29%) |
| ap07_range040_next015 | tighten next body to 1.5% with range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.015, range20_max=0.4, top_n=50` | N=29, avg=2.79%, worst=-2.46%, win=48.28%, early=4(13.79%), stop=10(34.48%) | N=22, avg=6.06%, worst=-1.23%, win=59.09%, early=1(4.55%), stop=2(9.09%) |
| ap08_range040_ma60_055 | add mild MA60 extension cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, ma60_dist_max=0.55, range20_max=0.4, top_n=50` | N=31, avg=3.63%, worst=-2.46%, win=54.84%, early=4(12.90%), stop=9(29.03%) | N=22, avg=4.64%, worst=-1.86%, win=59.09%, early=1(4.55%), stop=3(13.64%) |
| ap09_range040_ret60max100 | cut extreme ret60 extension above 100% | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, ret60_max=1.0, top_n=50` | N=29, avg=4.24%, worst=-2.46%, win=58.62%, early=3(10.34%), stop=8(27.59%) | N=20, avg=5.92%, worst=-1.36%, win=60.00%, early=1(5.00%), stop=2(10.00%) |
| ap10_range040_ret60max080 | cut ret60 extension above 80% | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, ret60_max=0.8, top_n=50` | N=26, avg=4.51%, worst=-2.46%, win=61.54%, early=3(11.54%), stop=7(26.92%) | N=19, avg=5.73%, worst=-1.36%, win=57.89%, early=1(5.26%), stop=2(10.53%) |

## Feature Readout From Best Test

- Best: `ap06_range040_next005` with `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.005, range20_max=0.4, top_n=50`.
| feature | winner median | early/stop median | winner mean | early/stop mean |
|---|---:|---:|---:|---:|
| sig_range20 | 30.56% | 33.44% | 31.08% | 33.42% |
| sig_ret60 | 47.49% | 46.66% | 49.26% | 74.99% |
| entry_ma20_dist | 16.70% | 16.55% | 21.72% | 18.68% |
| entry_vol_exp | 130.58% | 111.14% | 213.92% | 189.92% |
| next_body_ret | 2.02% | 3.28% | 4.93% | 4.51% |
| min_10d | -2.92% | -12.89% | -5.49% | -17.24% |
| max_20d | 43.16% | 12.67% | 50.95% | 13.25% |

## Readout

- This report tests the applied improvement, not a broad search.
- If top_n expansion has no effect, ranking bottleneck is not daily candidate depth.
- If ret60_max helps, prior W4 momentum may be overextended rather than stronger.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-applied-improvement10-trades.csv`
