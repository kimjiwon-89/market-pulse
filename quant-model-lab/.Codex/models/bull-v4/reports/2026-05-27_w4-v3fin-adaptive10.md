# W4 V3-FIN Adaptive 10-Iteration Report

date: 2026-05-27
capital: 1,000,000,000
position_cash: 100,000,000
cpu_limit: 0.4
mode: test -> analyze -> mutate params -> retest, sequential only

## Ranking

| rank | iteration | score | train N | train avg | train worst | train win | train early | post N | post avg | post win |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | adaptive01 | 113.40 | 51 | 2.41% | -2.49% | 37.25% | 19.61% | 36 | 6.00% | 52.78% |
| 2 | adaptive02 | 113.40 | 51 | 2.41% | -2.49% | 37.25% | 19.61% | 36 | 6.00% | 52.78% |
| 3 | adaptive03 | 113.40 | 51 | 2.41% | -2.49% | 37.25% | 19.61% | 36 | 6.00% | 52.78% |
| 4 | adaptive06 | 93.09 | 38 | 2.72% | -2.46% | 44.74% | 10.53% | 32 | 5.88% | 53.12% |
| 5 | adaptive07 | 93.09 | 38 | 2.72% | -2.46% | 44.74% | 10.53% | 32 | 5.88% | 53.12% |
| 6 | adaptive05 | 92.99 | 38 | 2.72% | -2.46% | 44.74% | 10.53% | 32 | 5.88% | 53.12% |
| 7 | adaptive04 | 92.89 | 38 | 2.72% | -2.46% | 44.74% | 10.53% | 32 | 5.88% | 53.12% |
| 8 | adaptive08 | 48.50 | 19 | 2.36% | -2.46% | 36.84% | 21.05% | 18 | 3.61% | 38.89% |
| 9 | adaptive09 | 48.50 | 19 | 2.36% | -2.46% | 36.84% | 21.05% | 18 | 3.61% | 38.89% |
| 10 | adaptive10 | 48.50 | 19 | 2.36% | -2.46% | 36.84% | 21.05% | 18 | 3.61% | 38.89% |

## Iteration Log

| iteration | params | train | post | analysis -> next change |
|---|---|---|---|---|
| adaptive01 | `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.0, top_n=50` | N=51, avg=2.41%, worst=-2.49%, win=37.25%, early=10(19.61%), stop=15(29.41%) | N=36, avg=6.00%, worst=-3.21%, win=52.78%, early=5(13.89%), stop=6(16.67%) | worst month weak -> stronger entry candle loc |
| adaptive02 | `delay=5, entry_loc=0.6, entry_ma20_min=0.02, entry_next_body_min=0.0, top_n=50` | N=51, avg=2.41%, worst=-2.49%, win=37.25%, early=10(19.61%), stop=15(29.41%) | N=36, avg=6.00%, worst=-3.21%, win=52.78%, early=5(13.89%), stop=6(16.67%) | worst month weak -> stronger entry candle loc |
| adaptive03 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.0, top_n=50` | N=51, avg=2.41%, worst=-2.49%, win=37.25%, early=10(19.61%), stop=15(29.41%) | N=36, avg=6.00%, worst=-3.21%, win=52.78%, early=5(13.89%), stop=6(16.67%) | worst month weak -> require next body >= 1% |
| adaptive04 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=50` | N=38, avg=2.72%, worst=-2.46%, win=44.74%, early=4(10.53%), stop=14(36.84%) | N=32, avg=5.88%, worst=-1.81%, win=53.12%, early=4(12.50%), stop=5(15.62%) | metrics tolerable -> expand sample |
| adaptive05 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=60` | N=38, avg=2.72%, worst=-2.46%, win=44.74%, early=4(10.53%), stop=14(36.84%) | N=32, avg=5.88%, worst=-1.81%, win=53.12%, early=4(12.50%), stop=5(15.62%) | metrics tolerable -> expand sample |
| adaptive06 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=70` | N=38, avg=2.72%, worst=-2.46%, win=44.74%, early=4(10.53%), stop=14(36.84%) | N=32, avg=5.88%, worst=-1.81%, win=53.12%, early=4(12.50%), stop=5(15.62%) | metrics tolerable -> expand sample |
| adaptive07 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=80` | N=38, avg=2.72%, worst=-2.46%, win=44.74%, early=4(10.53%), stop=14(36.84%) | N=32, avg=5.88%, worst=-1.81%, win=53.12%, early=4(12.50%), stop=5(15.62%) | fallback -> raise volume quality |
| adaptive08 | `delay=5, entry_loc=0.65, entry_ma20_min=0.02, entry_next_body_min=0.01, top_n=80, vol_exp_min=1.0` | N=19, avg=2.36%, worst=-2.46%, win=36.84%, early=4(21.05%), stop=6(31.58%) | N=18, avg=3.61%, worst=-1.64%, win=38.89%, early=1(5.56%), stop=4(22.22%) | sample too small -> loosen entry/top_n |
| adaptive09 | `delay=5, entry_loc=0.62, entry_ma20_min=0.01, entry_next_body_min=0.01, top_n=80, vol_exp_min=1.0` | N=19, avg=2.36%, worst=-2.46%, win=36.84%, early=4(21.05%), stop=6(31.58%) | N=18, avg=3.61%, worst=-1.64%, win=38.89%, early=1(5.56%), stop=4(22.22%) | sample too small -> loosen entry/top_n |
| adaptive10 | `delay=5, entry_loc=0.59, entry_ma20_min=0.0, entry_next_body_min=0.01, top_n=80, vol_exp_min=1.0` | N=19, avg=2.36%, worst=-2.46%, win=36.84%, early=4(21.05%), stop=6(31.58%) | N=18, avg=3.61%, worst=-1.64%, win=38.89%, early=1(5.56%), stop=4(22.22%) | final iteration |

## Readout

- Best adaptive candidate: `adaptive01` with `delay=5, entry_loc=0.55, entry_ma20_min=0.02, entry_next_body_min=0.0, top_n=50`.
- Loop optimized sample quality, not final profit. Score rewards train/post sample, positive avg, win rate, and lower drawdown/early-fail.
- If best still has high early fail, next work should scan entry-day features around early-fail trades before tightening more filters.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-adaptive10-trades.csv`
