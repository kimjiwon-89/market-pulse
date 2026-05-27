# W4 V3-FIN Post Exit Grid

date: 2026-05-27
pre: 2012-01-01~2022-04-30
train: 2022-05-01~2025-07-31
post: 2025-08-01~2026-05-20

## Ranking

| rank | variant | pass40 | post>=0 | score | pre avg | train avg | train worst | train win | post avg | N train | N post |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | ef_close6_cond_ext60 | Y | Y | 0.9137 | 12.78% | 52.10% | -0.17% | 83.33% | 56.57% | 6 | 1 |
| 2 | ef_low10_close6_cond_ext60 | Y | Y | 0.9137 | 12.78% | 52.10% | -0.17% | 83.33% | 56.57% | 6 | 1 |
| 3 | ef_close8_cond_ext60 | Y | Y | 0.9060 | 12.01% | 52.10% | -0.17% | 83.33% | 56.57% | 6 | 1 |
| 4 | no_ef_cond_ext60 | Y | Y | 0.9045 | 11.86% | 52.10% | -0.17% | 83.33% | 56.57% | 6 | 1 |
| 5 | base_cond_ext60_ret25_t20 | Y | N | 0.6704 | 13.01% | 46.09% | -6.30% | 85.71% | -2.90% | 7 | 2 |
| 6 | ef_recover_ma20_cond_ext60 | Y | N | 0.6704 | 13.01% | 46.09% | -6.30% | 85.71% | -2.90% | 7 | 2 |
| 7 | ef_day5_cond_ext60 | Y | N | 0.6454 | 10.51% | 46.09% | -6.30% | 85.71% | -2.90% | 7 | 2 |
| 8 | ma5trail_post_guard | N | Y | 0.3974 | 11.22% | 18.31% | -12.30% | 62.50% | 3.15% | 8 | 4 |

## Full Result

| variant | period | avg monthly | total | worst | N | win | early fail | stop |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| base_cond_ext60_ret25_t20 | pre | 13.01% | 1042.78% | -12.30% | 26 | 50.0% | 5 | 6 |
| base_cond_ext60_ret25_t20 | train_to_2025_06 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| base_cond_ext60_ret25_t20 | train_to_2025_07 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| base_cond_ext60_ret25_t20 | post_from_2025_07 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| base_cond_ext60_ret25_t20 | post_from_2025_08 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| ef_close6_cond_ext60 | pre | 12.78% | 969.60% | -12.30% | 26 | 50.0% | 4 | 7 |
| ef_close6_cond_ext60 | train_to_2025_06 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_close6_cond_ext60 | train_to_2025_07 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_close6_cond_ext60 | post_from_2025_07 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_close6_cond_ext60 | post_from_2025_08 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_close8_cond_ext60 | pre | 12.01% | 758.29% | -12.30% | 26 | 50.0% | 1 | 10 |
| ef_close8_cond_ext60 | train_to_2025_06 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_close8_cond_ext60 | train_to_2025_07 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_close8_cond_ext60 | post_from_2025_07 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_close8_cond_ext60 | post_from_2025_08 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_recover_ma20_cond_ext60 | pre | 13.01% | 1042.78% | -12.30% | 26 | 50.0% | 5 | 6 |
| ef_recover_ma20_cond_ext60 | train_to_2025_06 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| ef_recover_ma20_cond_ext60 | train_to_2025_07 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| ef_recover_ma20_cond_ext60 | post_from_2025_07 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| ef_recover_ma20_cond_ext60 | post_from_2025_08 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| ef_low10_close6_cond_ext60 | pre | 12.78% | 969.60% | -12.30% | 26 | 50.0% | 4 | 7 |
| ef_low10_close6_cond_ext60 | train_to_2025_06 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_low10_close6_cond_ext60 | train_to_2025_07 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| ef_low10_close6_cond_ext60 | post_from_2025_07 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_low10_close6_cond_ext60 | post_from_2025_08 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ef_day5_cond_ext60 | pre | 10.51% | 549.01% | -12.30% | 26 | 42.3% | 8 | 5 |
| ef_day5_cond_ext60 | train_to_2025_06 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| ef_day5_cond_ext60 | train_to_2025_07 | 46.09% | 1005.76% | -6.30% | 7 | 85.7% | 1 | 0 |
| ef_day5_cond_ext60 | post_from_2025_07 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| ef_day5_cond_ext60 | post_from_2025_08 | -2.90% | -5.83% | -6.30% | 2 | 50.0% | 1 | 0 |
| no_ef_cond_ext60 | pre | 11.86% | 720.85% | -12.30% | 26 | 50.0% | 0 | 11 |
| no_ef_cond_ext60 | train_to_2025_06 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| no_ef_cond_ext60 | train_to_2025_07 | 52.10% | 914.14% | -0.17% | 6 | 83.3% | 0 | 0 |
| no_ef_cond_ext60 | post_from_2025_07 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| no_ef_cond_ext60 | post_from_2025_08 | 56.57% | 56.57% | 56.57% | 1 | 100.0% | 0 | 0 |
| ma5trail_post_guard | pre | 11.22% | 874.72% | -12.30% | 26 | 57.7% | 5 | 5 |
| ma5trail_post_guard | train_to_2025_06 | 22.69% | 245.59% | -12.30% | 7 | 71.4% | 1 | 1 |
| ma5trail_post_guard | train_to_2025_07 | 18.31% | 203.09% | -12.30% | 8 | 62.5% | 1 | 2 |
| ma5trail_post_guard | post_from_2025_07 | 3.15% | 9.24% | -12.30% | 4 | 50.0% | 1 | 1 |
| ma5trail_post_guard | post_from_2025_08 | 8.29% | 24.56% | -6.30% | 3 | 66.7% | 1 | 0 |

## Readout

- Post loss source: 2025-09-17 COSES hit intraday early-fail, then rose sharply.
- This grid tests whether early-fail needs close confirmation or MA20 recovery grace.
- Promote only if train stays >=40%, worst >=-13%, win >=70%, pre positive, and post >=0.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-post-exit-grid-trades.csv`
