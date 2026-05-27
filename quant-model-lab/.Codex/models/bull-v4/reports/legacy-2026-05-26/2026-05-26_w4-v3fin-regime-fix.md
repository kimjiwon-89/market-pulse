# W4 V3-FIN-NB-SHADOW08 Regime Fix

date: 2026-05-26
pre: 2012-01-01~2022-04-30
train: 2022-05-01~2025-07-31
post: 2025-08-01~2026-05-20

| variant | period | avg monthly | total | worst | N | win | early fail |
|---|---|---:|---:|---:|---:|---:|---:|
| kospi_ma60 | pre | -2.06% | -66.39% | -18.30% | 29 | 31.0% | 4 |
| kospi_ma60 | train_to_2025_06 | 25.38% | 384.47% | -18.30% | 9 | 55.6% | 2 |
| kospi_ma60 | train_to_2025_07 | 21.01% | 295.81% | -18.30% | 10 | 50.0% | 2 |
| kospi_ma60 | post_from_2025_07 | 503.94% | 2352.65% | -18.30% | 3 | 66.7% | 0 |
| kospi_ma60 | post_from_2025_08 | 765.06% | 2902.02% | 95.64% | 2 | 100.0% | 0 |
| kosdaq_ma60 | pre | 2.03% | -26.59% | -18.30% | 30 | 30.0% | 3 |
| kosdaq_ma60 | train_to_2025_06 | 15.55% | 68.31% | -18.30% | 6 | 33.3% | 1 |
| kosdaq_ma60 | train_to_2025_07 | 12.81% | 83.77% | -18.30% | 8 | 50.0% | 1 |
| kosdaq_ma60 | post_from_2025_07 | 16.74% | 83.46% | -8.30% | 5 | 80.0% | 1 |
| kosdaq_ma60 | post_from_2025_08 | 24.84% | 68.03% | -8.30% | 3 | 66.7% | 1 |
| both_ma60 | pre | 1.49% | -36.20% | -18.30% | 26 | 26.9% | 4 |
| both_ma60 | train_to_2025_06 | 22.50% | 101.53% | -18.30% | 5 | 60.0% | 1 |
| both_ma60 | train_to_2025_07 | 17.38% | 120.04% | -18.30% | 7 | 71.4% | 1 |
| both_ma60 | post_from_2025_07 | 16.74% | 83.46% | -8.30% | 5 | 80.0% | 1 |
| both_ma60 | post_from_2025_08 | 24.84% | 68.03% | -8.30% | 3 | 66.7% | 1 |
| kospi_ma20 | pre | 5.25% | 162.83% | -18.30% | 37 | 37.8% | 7 |
| kospi_ma20 | train_to_2025_06 | 20.34% | 381.74% | -8.30% | 10 | 50.0% | 2 |
| kospi_ma20 | train_to_2025_07 | 16.83% | 293.58% | -18.30% | 11 | 45.5% | 2 |
| kospi_ma20 | post_from_2025_07 | 38.67% | 59.84% | -18.30% | 2 | 50.0% | 0 |
| kospi_ma20 | post_from_2025_08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| kosdaq_ma20 | pre | 4.22% | 58.79% | -18.30% | 37 | 37.8% | 6 |
| kosdaq_ma20 | train_to_2025_06 | 25.71% | 541.50% | -8.30% | 10 | 50.0% | 2 |
| kosdaq_ma20 | train_to_2025_07 | 21.71% | 424.10% | -18.30% | 11 | 45.5% | 2 |
| kosdaq_ma20 | post_from_2025_07 | 38.67% | 59.84% | -18.30% | 2 | 50.0% | 0 |
| kosdaq_ma20 | post_from_2025_08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| both_ma20 | pre | 7.84% | 375.41% | -18.30% | 33 | 42.4% | 7 |
| both_ma20 | train_to_2025_06 | 23.53% | 425.35% | -8.30% | 9 | 55.6% | 1 |
| both_ma20 | train_to_2025_07 | 19.34% | 329.21% | -18.30% | 10 | 50.0% | 1 |
| both_ma20 | post_from_2025_07 | 38.67% | 59.84% | -18.30% | 2 | 50.0% | 0 |
| both_ma20 | post_from_2025_08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| no_regime | pre | 1.54% | -22.48% | -18.30% | 48 | 33.3% | 8 |
| no_regime | train_to_2025_06 | 23.93% | 557.69% | -18.30% | 11 | 54.5% | 2 |
| no_regime | train_to_2025_07 | 20.96% | 618.09% | -18.30% | 13 | 61.5% | 2 |
| no_regime | post_from_2025_07 | 16.74% | 83.46% | -8.30% | 5 | 80.0% | 1 |
| no_regime | post_from_2025_08 | 24.84% | 68.03% | -8.30% | 3 | 66.7% | 1 |

## Readout

- Goal: fix 2012-2014 extended-pre failure while keeping train >=15%.
- Promote only if pre turns positive and train/post remain positive.
- Trades: `.Codex/reports/2026-05-26_w4-v3fin-regime-fix-trades.csv`

## Candidate Update

Promote `both_ma20` over prior `KOSPI_ma60`.

Reason:

- Extended pre from 2012 fails under KOSPI-only MA60.
- `both_ma20` keeps pre/train/post positive and keeps train above 15%.

Selected result:

| period | avg monthly | total | worst | N | win | early fail |
|---|---:|---:|---:|---:|---:|---:|
| pre 2012-2022 | 7.84% | 375.41% | -18.30% | 33 | 42.4% | 7 |
| train to 2025-06 | 23.53% | 425.35% | -8.30% | 9 | 55.6% | 1 |
| train to 2025-07 | 19.34% | 329.21% | -18.30% | 10 | 50.0% | 1 |
| post from 2025-07 | 38.67% | 59.84% | -18.30% | 2 | 50.0% | 0 |
| post from 2025-08 | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |

Code conversion note:

- Mapper/service should use KOSPI and KOSDAQ both above MA20.
- Do not use KOSPI-only MA60 for the final V3-FIN-NB candidate.
