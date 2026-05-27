# W4 V3-FIN Applied Improvement 10-Test Report

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
cpu_limit: 0.4
mode: apply next_body >= 1% + range20 <= 40%, then retest variants sequentially

## Ranking

| rank | test | score | train N | train avg | train worst | train win | train early | train stop | post N | post avg | post win |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | ap05_range045_top50 | 24.02 | 60 | 2.37% | -1.86% | 41.67% | 10.00% | 36.67% | 0 | - | - |
| 2 | ap04_range042_top50 | 22.07 | 57 | 2.40% | -1.86% | 42.11% | 10.53% | 36.84% | 0 | - | - |
| 3 | ap06_range040_next005 | 21.27 | 59 | 2.14% | -2.46% | 40.68% | 13.56% | 32.20% | 0 | - | - |
| 4 | ap01_range040_top50 | 18.49 | 52 | 2.18% | -1.86% | 42.31% | 11.54% | 34.62% | 0 | - | - |
| 5 | ap02_range040_top60 | 18.49 | 52 | 2.18% | -1.86% | 42.31% | 11.54% | 34.62% | 0 | - | - |
| 6 | ap03_range040_top80 | 18.49 | 52 | 2.18% | -1.86% | 42.31% | 11.54% | 34.62% | 0 | - | - |
| 7 | ap08_range040_ma60_055 | 18.43 | 51 | 2.33% | -1.86% | 43.14% | 11.76% | 33.33% | 0 | - | - |
| 8 | ap09_range040_ret60max100 | 17.12 | 48 | 2.40% | -1.86% | 43.75% | 10.42% | 33.33% | 0 | - | - |
| 9 | ap07_range040_next015 | 14.85 | 47 | 1.91% | -1.86% | 42.55% | 10.64% | 36.17% | 0 | - | - |
| 10 | ap10_range040_ret60max080 | 10.51 | 45 | 2.12% | -3.69% | 42.22% | 11.11% | 35.56% | 0 | - | - |

## Test Log

| test | intent | params | train | post |
|---|---|---|---|---|
| ap01_range040_top50 | applied improvement baseline | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=50` | N=52, avg=2.18%, worst=-1.86%, win=42.31%, early=6(11.54%), stop=18(34.62%) | no trades |
| ap02_range040_top60 | recover sample by wider daily rank | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=60` | N=52, avg=2.18%, worst=-1.86%, win=42.31%, early=6(11.54%), stop=18(34.62%) | no trades |
| ap03_range040_top80 | recover sample more by wider daily rank | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, top_n=80` | N=52, avg=2.18%, worst=-1.86%, win=42.31%, early=6(11.54%), stop=18(34.62%) | no trades |
| ap04_range042_top50 | slightly loosen range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.42, top_n=50` | N=57, avg=2.40%, worst=-1.86%, win=42.11%, early=6(10.53%), stop=21(36.84%) | no trades |
| ap05_range045_top50 | loosen range cap to old relaxed level | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.45, top_n=50` | N=60, avg=2.37%, worst=-1.86%, win=41.67%, early=6(10.00%), stop=22(36.67%) | no trades |
| ap06_range040_next005 | loosen next body to 0.5% with range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.005, range20_max=0.4, top_n=50` | N=59, avg=2.14%, worst=-2.46%, win=40.68%, early=8(13.56%), stop=19(32.20%) | no trades |
| ap07_range040_next015 | tighten next body to 1.5% with range cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.015, range20_max=0.4, top_n=50` | N=47, avg=1.91%, worst=-1.86%, win=42.55%, early=5(10.64%), stop=17(36.17%) | no trades |
| ap08_range040_ma60_055 | add mild MA60 extension cap | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, ma60_dist_max=0.55, range20_max=0.4, top_n=50` | N=51, avg=2.33%, worst=-1.86%, win=43.14%, early=6(11.76%), stop=17(33.33%) | no trades |
| ap09_range040_ret60max100 | cut extreme ret60 extension above 100% | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, ret60_max=1.0, top_n=50` | N=48, avg=2.40%, worst=-1.86%, win=43.75%, early=5(10.42%), stop=16(33.33%) | no trades |
| ap10_range040_ret60max080 | cut ret60 extension above 80% | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.4, ret60_max=0.8, top_n=50` | N=45, avg=2.12%, worst=-3.69%, win=42.22%, early=5(11.11%), stop=16(35.56%) | no trades |

## Feature Readout From Best Test

- Best: `ap05_range045_top50` with `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.01, range20_max=0.45, top_n=50`.
| feature | winner median | early/stop median | winner mean | early/stop mean |
|---|---:|---:|---:|---:|
| sig_range20 | 32.43% | 33.16% | 32.37% | 33.69% |
| sig_ret60 | 54.24% | 41.46% | 59.20% | 52.98% |
| entry_ma20_dist | 15.36% | 17.87% | 23.86% | 22.30% |
| entry_vol_exp | 122.87% | 112.61% | 201.70% | 158.37% |
| next_body_ret | 5.50% | 3.28% | 6.75% | 4.54% |
| min_10d | -2.02% | -13.86% | -4.07% | -17.27% |
| max_20d | 44.93% | 11.63% | 53.39% | 19.01% |

## Readout

- This report tests the applied improvement, not a broad search.
- If top_n expansion has no effect, ranking bottleneck is not daily candidate depth.
- If ret60_max helps, prior W4 momentum may be overextended rather than stronger.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-applied-improvement10-trades.csv`
