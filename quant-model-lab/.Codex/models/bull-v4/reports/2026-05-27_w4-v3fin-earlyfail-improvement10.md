# W4 V3-FIN Early-Fail Improvement 10 Tests

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
cpu_limit: 0.4
mode: early-fail focused sequential tests from adaptive04 finding

## Ranking

| rank | test | score | train N | train avg | train worst | train win | train early | train stop | post N | post avg | post win |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | ef01_next005 | 74.74 | 48 | 2.47% | -2.49% | 39.58% | 20.83% | 29.17% | 35 | 6.07% | 54.29% |
| 2 | ef02_next010_base | 67.58 | 38 | 2.72% | -2.46% | 44.74% | 10.53% | 36.84% | 32 | 5.88% | 53.12% |
| 3 | ef08_next010_range040 | 58.41 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 26 | 5.81% | 57.69% |
| 4 | ef03_next015 | 57.82 | 35 | 2.20% | -2.46% | 40.00% | 11.43% | 40.00% | 26 | 6.40% | 57.69% |
| 5 | ef05_next010_ma60_055 | 57.33 | 32 | 3.36% | -2.46% | 53.12% | 12.50% | 31.25% | 24 | 4.89% | 54.17% |
| 6 | ef10_next010_vol07 | 51.57 | 28 | 2.46% | -1.67% | 42.86% | 14.29% | 32.14% | 27 | 3.58% | 48.15% |
| 7 | ef04_next020 | 50.87 | 27 | 2.40% | -2.46% | 37.04% | 7.41% | 44.44% | 24 | 7.45% | 58.33% |
| 8 | ef06_next010_ma60_040 | 50.15 | 29 | 3.59% | -2.46% | 55.17% | 13.79% | 27.59% | 20 | 3.93% | 55.00% |
| 9 | ef09_next010_range035 | 30.15 | 23 | 3.71% | -2.46% | 52.17% | 13.04% | 30.43% | 18 | 7.17% | 66.67% |
| 10 | ef07_next010_ma60_030 | 16.34 | 16 | 2.59% | -2.46% | 50.00% | 12.50% | 31.25% | 15 | 2.73% | 53.33% |

## Test Log

| test | intent | params | train | post |
|---|---|---|---|---|
| ef01_next005 | loosen next-body floor to recover sample | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.005, top_n=50` | N=48, avg=2.47%, worst=-2.49%, win=39.58%, early=10(20.83%), stop=14(29.17%) | N=35, avg=6.07%, worst=-2.58%, win=54.29%, early=4(11.43%), stop=6(17.14%) |
| ef02_next010_base | adaptive04 core: next-body >= 1% | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=50` | N=38, avg=2.72%, worst=-2.46%, win=44.74%, early=4(10.53%), stop=14(36.84%) | N=32, avg=5.88%, worst=-1.81%, win=53.12%, early=4(12.50%), stop=5(15.62%) |
| ef03_next015 | tighten next-body floor | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.015, top_n=50` | N=35, avg=2.20%, worst=-2.46%, win=40.00%, early=4(11.43%), stop=14(40.00%) | N=26, avg=6.40%, worst=-1.18%, win=57.69%, early=2(7.69%), stop=3(11.54%) |
| ef04_next020 | tighten next-body floor more | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.02, top_n=50` | N=27, avg=2.40%, worst=-2.46%, win=37.04%, early=2(7.41%), stop=12(44.44%) | N=24, avg=7.45%, worst=-1.18%, win=58.33%, early=2(8.33%), stop=3(12.50%) |
| ef05_next010_ma60_055 | cut extreme MA60 extension | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, ma60_dist_max=0.55, top_n=50` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=24, avg=4.89%, worst=-1.86%, win=54.17%, early=2(8.33%), stop=4(16.67%) |
| ef06_next010_ma60_040 | cut stronger MA60 extension | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, ma60_dist_max=0.4, top_n=50` | N=29, avg=3.59%, worst=-2.46%, win=55.17%, early=4(13.79%), stop=8(27.59%) | N=20, avg=3.93%, worst=-1.23%, win=55.00%, early=2(10.00%), stop=3(15.00%) |
| ef07_next010_ma60_030 | cut aggressive MA60 extension | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, ma60_dist_max=0.3, top_n=50` | N=16, avg=2.59%, worst=-2.46%, win=50.00%, early=2(12.50%), stop=5(31.25%) | N=15, avg=2.73%, worst=-1.23%, win=53.33%, early=1(6.67%), stop=2(13.33%) |
| ef08_next010_range040 | cut wide 20d range | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=50` | N=32, avg=3.36%, worst=-2.46%, win=53.12%, early=4(12.50%), stop=10(31.25%) | N=26, avg=5.81%, worst=-1.86%, win=57.69%, early=2(7.69%), stop=3(11.54%) |
| ef09_next010_range035 | cut tighter 20d range | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.35, top_n=50` | N=23, avg=3.71%, worst=-2.46%, win=52.17%, early=3(13.04%), stop=7(30.43%) | N=18, avg=7.17%, worst=-1.23%, win=66.67%, early=0(0.00%), stop=3(16.67%) |
| ef10_next010_vol07 | mild volume floor | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=50, vol_exp_min=0.7` | N=28, avg=2.46%, worst=-1.67%, win=42.86%, early=4(14.29%), stop=9(32.14%) | N=27, avg=3.58%, worst=-1.86%, win=48.15%, early=3(11.11%), stop=5(18.52%) |

## Feature Readout From Best Test

- Best: `ef01_next005` with `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.005, top_n=50`.
| feature | winner median | early/stop median | winner mean | early/stop mean |
|---|---:|---:|---:|---:|
| sig_range20 | 30.56% | 37.81% | 31.08% | 37.71% |
| sig_ret60 | 47.49% | 79.74% | 49.26% | 86.40% |
| entry_vol_exp | 130.58% | 119.58% | 213.92% | 177.97% |
| entry_ma20_dist | 16.70% | 18.06% | 21.72% | 30.54% |
| next_body_ret | 2.02% | 2.87% | 4.93% | 4.08% |
| max_20d | 43.16% | 12.84% | 50.95% | 23.15% |
| min_10d | -2.92% | -13.34% | -5.49% | -16.80% |

## Readout

- If next-body threshold improves quality but sample falls too hard, use 0.5% or 1.0%, not 2.0%.
- If MA60/range filters improve train but hurt post/sample, keep them diagnostic only.
- Next loop should modify exit rules for STOP-heavy trades if entry filters stop helping.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-earlyfail-improvement10-trades.csv`
