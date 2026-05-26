# W4 V3-FIN-NB-SHADOW08 Robustness Pass

date: 2026-05-26

pre: 2012-01-01~2022-04-30
train: 2022-05-01~2025-07-31
post: 2025-08-01~2026-05-20

## Result

| variant | period | avg monthly | total | worst | N | win | early fail |
|---|---|---:|---:|---:|---:|---:|---:|
| shadow08_delay3 | pre | 0.12% | -39.41% | -18.30% | 41 | 34.1% | 13 |
| shadow08_delay3 | train_to_2025_06 | 11.33% | 78.55% | -8.30% | 7 | 57.1% | 3 |
| shadow08_delay3 | train_to_2025_07 | 11.33% | 78.55% | -8.30% | 7 | 57.1% | 3 |
| shadow08_delay3 | post_from_2025_07 | -4.69% | -13.78% | -8.30% | 3 | 33.3% | 2 |
| shadow08_delay3 | post_from_2025_08 | -4.69% | -13.78% | -8.30% | 3 | 33.3% | 2 |
| shadow08_delay5 | pre | -3.44% | -74.51% | -18.30% | 30 | 30.0% | 6 |
| shadow08_delay5 | train_to_2025_06 | 26.30% | 324.07% | -8.30% | 7 | 57.1% | 1 |
| shadow08_delay5 | train_to_2025_07 | 23.01% | 324.21% | -8.30% | 8 | 62.5% | 1 |
| shadow08_delay5 | post_from_2025_07 | 59.33% | 256.79% | 0.03% | 3 | 100.0% | 0 |
| shadow08_delay5 | post_from_2025_08 | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |
| shadow08_delay7 | pre | 10.50% | 1073.41% | -18.30% | 30 | 63.3% | 4 |
| shadow08_delay7 | train_to_2025_06 | -2.73% | -27.66% | -18.30% | 8 | 25.0% | 2 |
| shadow08_delay7 | train_to_2025_07 | -2.73% | -27.66% | -18.30% | 8 | 25.0% | 2 |
| shadow08_delay7 | post_from_2025_07 | 23.92% | 49.34% | 3.36% | 2 | 100.0% | 0 |
| shadow08_delay7 | post_from_2025_08 | 23.92% | 49.34% | 3.36% | 2 | 100.0% | 0 |
| shadow08_ret60min30 | pre | -2.91% | -68.79% | -18.30% | 29 | 31.0% | 6 |
| shadow08_ret60min30 | train_to_2025_06 | 27.99% | 265.06% | -8.30% | 6 | 50.0% | 1 |
| shadow08_ret60min30 | train_to_2025_07 | 23.99% | 265.18% | -8.30% | 7 | 57.1% | 1 |
| shadow08_ret60min30 | post_from_2025_07 | 59.33% | 256.79% | 0.03% | 3 | 100.0% | 0 |
| shadow08_ret60min30 | post_from_2025_08 | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |
| shadow08_ret60min40 | pre | -5.30% | -75.95% | -18.30% | 22 | 22.7% | 5 |
| shadow08_ret60min40 | train_to_2025_06 | 33.67% | 266.64% | -8.30% | 5 | 60.0% | 1 |
| shadow08_ret60min40 | train_to_2025_07 | 28.06% | 266.76% | -8.30% | 6 | 66.7% | 1 |
| shadow08_ret60min40 | post_from_2025_07 | 47.83% | 95.70% | 0.03% | 2 | 100.0% | 0 |
| shadow08_ret60min40 | post_from_2025_08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| shadow08_ret60min50 | pre | -5.45% | -71.71% | -18.30% | 19 | 21.1% | 4 |
| shadow08_ret60min50 | train_to_2025_06 | 44.16% | 299.83% | -0.78% | 4 | 75.0% | 0 |
| shadow08_ret60min50 | train_to_2025_07 | 35.34% | 299.96% | -0.78% | 5 | 80.0% | 0 |
| shadow08_ret60min50 | post_from_2025_07 | 47.83% | 95.70% | 0.03% | 2 | 100.0% | 0 |
| shadow08_ret60min50 | post_from_2025_08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |

## Pre Early-Fail Rows For Current Candidate

| signal | code | name | entry | exit | ret |
|---|---|---|---|---|---:|
| 2012-04-19 | 013810 | 스페코 | 2012-04-27 | 2012-05-02 | -8.30% |
| 2013-02-22 | 048830 | 엔피케이 | 2013-03-05 | 2013-03-07 | -8.30% |
| 2013-06-05 | 044340 | 위닉스 | 2013-06-14 | 2013-06-19 | -8.30% |
| 2014-12-09 | 900070 | 글로벌에스엠 | 2014-12-18 | 2014-12-19 | -8.30% |
| 2017-12-07 | 042520 | 한스바이오메드 | 2017-12-15 | 2017-12-19 | -8.30% |
| 2020-07-20 | 298040 | 효성중공업 | 2020-07-28 | 2020-07-30 | -8.30% |

## Readout

- `shadow08_delay5` is the current candidate.
- Delay sensitivity must keep train >=15% under both train-end splits.
- Ret60-min probes are only simple pre early-fail blockers; reject if train/post collapse.
- Trades: `.Codex/reports/2026-05-26_w4-v3fin-robustness-trades.csv`
