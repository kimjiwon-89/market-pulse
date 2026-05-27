# W4 V3-FIN Early-Fail Reduction

date: 2026-05-26
pre: 2015-01-01~2022-04-30
train: 2022-05-01~2025-07-31
post: 2025-08-01~2026-05-20

## Result

| variant | period | avg monthly | total | worst | N | win | early fail |
|---|---|---:|---:|---:|---:|---:|---:|
| nb_top5_cad3 | pre | -4.37% | -69.22% | -18.30% | 23 | 30.4% | 8 |
| nb_top5_cad3 | train | 9.63% | 67.33% | -10.92% | 7 | 57.1% | 1 |
| nb_top5_cad3 | post | - | - | - | 0 | - | 0 |
| nb_top5_cad5 | pre | -0.02% | -23.47% | -18.30% | 15 | 26.7% | 3 |
| nb_top5_cad5 | train | 21.35% | 158.29% | -18.30% | 6 | 50.0% | 1 |
| nb_top5_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top5_cad7 | pre | -3.87% | -32.99% | -18.30% | 8 | 37.5% | 0 |
| nb_top5_cad7 | train | -8.30% | -22.89% | -8.30% | 3 | 0.0% | 3 |
| nb_top5_cad7 | post | -1.27% | -1.27% | -1.27% | 1 | 0.0% | 0 |
| nb_top5_cad10 | pre | 0.83% | -8.32% | -18.30% | 10 | 30.0% | 3 |
| nb_top5_cad10 | train | -9.13% | -25.66% | -18.30% | 3 | 0.0% | 1 |
| nb_top5_cad10 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top10_cad3 | pre | -0.98% | -44.09% | -18.30% | 29 | 37.9% | 9 |
| nb_top10_cad3 | train | 8.20% | 94.84% | -18.30% | 11 | 54.5% | 2 |
| nb_top10_cad3 | post | -9.05% | -9.05% | -9.05% | 1 | 0.0% | 0 |
| nb_top10_cad5 | pre | 7.84% | 142.45% | -18.30% | 18 | 38.9% | 4 |
| nb_top10_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_top10_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top10_cad7 | pre | 4.14% | 32.52% | -18.30% | 13 | 53.8% | 1 |
| nb_top10_cad7 | train | -8.30% | -29.29% | -8.30% | 4 | 0.0% | 4 |
| nb_top10_cad7 | post | -1.27% | -1.27% | -1.27% | 1 | 0.0% | 0 |
| nb_top10_cad10 | pre | 0.83% | -8.32% | -18.30% | 10 | 30.0% | 3 |
| nb_top10_cad10 | train | -3.90% | -20.81% | -18.30% | 5 | 20.0% | 2 |
| nb_top10_cad10 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top15_cad3 | pre | -0.05% | -34.52% | -18.30% | 31 | 35.5% | 10 |
| nb_top15_cad3 | train | 8.20% | 94.84% | -18.30% | 11 | 54.5% | 2 |
| nb_top15_cad3 | post | -17.35% | -16.60% | -17.35% | 2 | 0.0% | 1 |
| nb_top15_cad5 | pre | 10.72% | 377.32% | -18.30% | 21 | 42.9% | 4 |
| nb_top15_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_top15_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top15_cad7 | pre | 6.72% | 85.92% | -18.30% | 16 | 56.2% | 1 |
| nb_top15_cad7 | train | -8.47% | -35.77% | -9.16% | 5 | 0.0% | 4 |
| nb_top15_cad7 | post | -1.27% | -1.27% | -1.27% | 1 | 0.0% | 0 |
| nb_top15_cad10 | pre | 5.12% | 38.66% | -18.30% | 12 | 33.3% | 3 |
| nb_top15_cad10 | train | -5.90% | -29.45% | -18.30% | 5 | 20.0% | 1 |
| nb_top15_cad10 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top20_cad3 | pre | 2.47% | 11.15% | -18.30% | 32 | 37.5% | 9 |
| nb_top20_cad3 | train | 5.40% | 64.69% | -18.30% | 14 | 42.9% | 5 |
| nb_top20_cad3 | post | -17.35% | -16.60% | -17.35% | 2 | 0.0% | 1 |
| nb_top20_cad5 | pre | 10.57% | 365.22% | -18.30% | 21 | 42.9% | 4 |
| nb_top20_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_top20_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_top20_cad7 | pre | 7.65% | 127.97% | -18.30% | 17 | 58.8% | 1 |
| nb_top20_cad7 | train | -8.47% | -35.77% | -9.16% | 5 | 0.0% | 4 |
| nb_top20_cad7 | post | -1.27% | -1.27% | -1.27% | 1 | 0.0% | 0 |
| nb_top20_cad10 | pre | 5.12% | 38.66% | -18.30% | 12 | 33.3% | 3 |
| nb_top20_cad10 | train | -5.90% | -29.45% | -18.30% | 5 | 20.0% | 1 |
| nb_top20_cad10 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_relax_shadow_top10_cad3 | pre | 2.00% | -15.73% | -18.30% | 35 | 37.1% | 9 |
| nb_relax_shadow_top10_cad3 | train | 7.29% | 73.59% | -18.30% | 11 | 54.5% | 1 |
| nb_relax_shadow_top10_cad3 | post | -18.30% | -18.30% | -18.30% | 1 | 0.0% | 0 |
| nb_relax_loc_top10_cad3 | pre | -0.98% | -44.09% | -18.30% | 29 | 37.9% | 9 |
| nb_relax_loc_top10_cad3 | train | 8.20% | 94.84% | -18.30% | 11 | 54.5% | 2 |
| nb_relax_loc_top10_cad3 | post | -9.05% | -9.05% | -9.05% | 1 | 0.0% | 0 |
| nb_relax_shadow_top10_cad5 | pre | 6.62% | 79.65% | -18.30% | 23 | 30.4% | 5 |
| nb_relax_shadow_top10_cad5 | train | 23.01% | 324.21% | -8.30% | 8 | 62.5% | 1 |
| nb_relax_shadow_top10_cad5 | post | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |
| nb_relax_loc_top10_cad5 | pre | 7.84% | 142.45% | -18.30% | 18 | 38.9% | 4 |
| nb_relax_loc_top10_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_relax_loc_top10_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_relax_shadow_top15_cad3 | pre | 2.27% | -11.56% | -18.30% | 36 | 38.9% | 9 |
| nb_relax_shadow_top15_cad3 | train | 3.02% | 23.21% | -18.30% | 11 | 54.5% | 1 |
| nb_relax_shadow_top15_cad3 | post | -13.30% | -25.08% | -18.30% | 2 | 0.0% | 1 |
| nb_relax_loc_top15_cad3 | pre | -0.05% | -34.52% | -18.30% | 31 | 35.5% | 10 |
| nb_relax_loc_top15_cad3 | train | 8.20% | 94.84% | -18.30% | 11 | 54.5% | 2 |
| nb_relax_loc_top15_cad3 | post | -17.35% | -16.60% | -17.35% | 2 | 0.0% | 1 |
| nb_relax_shadow_top15_cad5 | pre | 9.78% | 285.68% | -18.30% | 25 | 36.0% | 4 |
| nb_relax_shadow_top15_cad5 | train | 23.01% | 324.21% | -8.30% | 8 | 62.5% | 1 |
| nb_relax_shadow_top15_cad5 | post | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |
| nb_relax_loc_top15_cad5 | pre | 10.72% | 377.32% | -18.30% | 21 | 42.9% | 4 |
| nb_relax_loc_top15_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_relax_loc_top15_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |
| nb_relax_shadow_top20_cad3 | pre | 6.24% | 163.22% | -18.30% | 37 | 40.5% | 8 |
| nb_relax_shadow_top20_cad3 | train | 4.69% | 46.73% | -18.30% | 14 | 42.9% | 4 |
| nb_relax_shadow_top20_cad3 | post | -13.30% | -25.08% | -18.30% | 2 | 0.0% | 1 |
| nb_relax_loc_top20_cad3 | pre | 2.47% | 11.15% | -18.30% | 32 | 37.5% | 9 |
| nb_relax_loc_top20_cad3 | train | 5.40% | 64.69% | -18.30% | 14 | 42.9% | 5 |
| nb_relax_loc_top20_cad3 | post | -17.35% | -16.60% | -17.35% | 2 | 0.0% | 1 |
| nb_relax_shadow_top20_cad5 | pre | 9.85% | 331.73% | -18.30% | 26 | 38.5% | 4 |
| nb_relax_shadow_top20_cad5 | train | 23.01% | 324.21% | -8.30% | 8 | 62.5% | 1 |
| nb_relax_shadow_top20_cad5 | post | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |
| nb_relax_loc_top20_cad5 | pre | 10.57% | 365.22% | -18.30% | 21 | 42.9% | 4 |
| nb_relax_loc_top20_cad5 | train | 15.33% | 118.64% | -18.30% | 7 | 42.9% | 1 |
| nb_relax_loc_top20_cad5 | post | 95.64% | 95.64% | 95.64% | 1 | 100.0% | 0 |

## Readout

- Grid starts from current candidate: next-day body confirmation, stop -18%, early_fail -8%.
- Main variables: top fallback and signal cadence.
- Relaxed shadow/location rows are probes for post sample expansion; reject if train drops below 15% or worst worsens too much.
- Trades: `.Codex/reports/2026-05-26_w4-v3fin-sample-expansion-trades.csv`

## Candidate Pick

Best current candidate:

```text
V3-FIN-NB-SHADOW08
top fallback 10
cadence 5 trading days
entry upper_shadow <= 0.08
next-day body_ret >= 0
stop -18%
early_fail -8% / 3d
trail 20/20
max hold 30d
KOSPI > MA60
```

Result:

| period | avg monthly | total | worst | N | win | early fail |
|---|---:|---:|---:|---:|---:|---:|
| pre | 6.62% | 79.65% | -18.30% | 23 | 30.4% | 5 |
| train | 23.01% | 324.21% | -8.30% | 8 | 62.5% | 1 |
| post | 88.98% | 256.68% | 82.32% | 2 | 100.0% | 0 |

Verdict:

- Better than prior candidate: train 15.33% -> 23.01%, train N 7 -> 8, post N 1 -> 2.
- Worst month improves on train: -18.30% -> -8.30%.
- Pre remains positive, but win rate is only 30.4% and still has 5 early fails.
- Still needs one more robustness pass before code conversion.

Next:

```text
1. Test this exact candidate across delay 3/5/7 and train end 2025-06 vs 2025-07.
2. Inspect pre early fails; try simple pre-filter only if it does not hurt train/post.
3. If stable, promote as V3-FIN-NB-SHADOW08 for mapper/service conversion.
```
