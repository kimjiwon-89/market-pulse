# W4 V3-FIN Regime Breakdown

date: 2026-05-27
pre: 2012-01-01~2022-04-30
train: 2022-05-01~2025-07-31
post: 2025-08-01~2026-05-20

## Overall

| variant | period | avg monthly | total | worst | N | win | early fail | stop |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| baseline_low_touch | pre | 13.01% | 1042.78% | -12.30% | 26 | 50.00% | 5 | 6 |
| baseline_low_touch | train_to_2025_06 | 46.09% | 1005.76% | -6.30% | 7 | 85.71% | 1 | 0 |
| baseline_low_touch | train_to_2025_07 | 46.09% | 1005.76% | -6.30% | 7 | 85.71% | 1 | 0 |
| baseline_low_touch | post_from_2025_07 | -2.90% | -5.83% | -6.30% | 2 | 50.00% | 1 | 0 |
| baseline_low_touch | post_from_2025_08 | -2.90% | -5.83% | -6.30% | 2 | 50.00% | 1 | 0 |
| best_ef_close6 | pre | 12.78% | 969.60% | -12.30% | 26 | 50.00% | 4 | 7 |
| best_ef_close6 | train_to_2025_06 | 52.10% | 914.14% | -0.17% | 6 | 83.33% | 0 | 0 |
| best_ef_close6 | train_to_2025_07 | 52.10% | 914.14% | -0.17% | 6 | 83.33% | 0 | 0 |
| best_ef_close6 | post_from_2025_07 | 56.57% | 56.57% | 56.57% | 1 | 100.00% | 0 | 0 |
| best_ef_close6 | post_from_2025_08 | 56.57% | 56.57% | 56.57% | 1 | 100.00% | 0 | 0 |

## By Regime

| variant | period | regime | avg monthly | total | worst | N | win | early fail | stop |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| baseline_low_touch | pre | BULL | 8.44% | 190.88% | -12.30% | 18 | 38.89% | 4 | 5 |
| baseline_low_touch | pre | SIDEWAYS | 22.13% | 154.10% | -12.30% | 6 | 66.67% | 1 | 1 |
| baseline_low_touch | pre | BEAR | 26.84% | 54.61% | 1.80% | 2 | 100.00% | 0 | 0 |
| baseline_low_touch | train_to_2025_06 | BULL | 63.74% | 559.54% | 16.16% | 4 | 100.00% | 0 | 0 |
| baseline_low_touch | train_to_2025_06 | SIDEWAYS | 22.55% | 67.66% | -6.30% | 3 | 66.67% | 1 | 0 |
| baseline_low_touch | train_to_2025_07 | BULL | 63.74% | 559.54% | 16.16% | 4 | 100.00% | 0 | 0 |
| baseline_low_touch | train_to_2025_07 | SIDEWAYS | 22.55% | 67.66% | -6.30% | 3 | 66.67% | 1 | 0 |
| baseline_low_touch | post_from_2025_07 | BULL | -2.90% | -5.83% | -6.30% | 2 | 50.00% | 1 | 0 |
| baseline_low_touch | post_from_2025_08 | BULL | -2.90% | -5.83% | -6.30% | 2 | 50.00% | 1 | 0 |
| best_ef_close6 | pre | BULL | 8.10% | 172.25% | -12.30% | 18 | 38.89% | 3 | 6 |
| best_ef_close6 | pre | SIDEWAYS | 22.13% | 154.10% | -12.30% | 6 | 66.67% | 1 | 1 |
| best_ef_close6 | pre | BEAR | 26.84% | 54.61% | 1.80% | 2 | 100.00% | 0 | 0 |
| best_ef_close6 | train_to_2025_06 | BULL | 79.60% | 467.77% | 61.77% | 3 | 100.00% | 0 | 0 |
| best_ef_close6 | train_to_2025_06 | SIDEWAYS | 24.59% | 78.62% | -0.17% | 3 | 66.67% | 0 | 0 |
| best_ef_close6 | train_to_2025_07 | BULL | 79.60% | 467.77% | 61.77% | 3 | 100.00% | 0 | 0 |
| best_ef_close6 | train_to_2025_07 | SIDEWAYS | 24.59% | 78.62% | -0.17% | 3 | 66.67% | 0 | 0 |
| best_ef_close6 | post_from_2025_07 | BULL | 56.57% | 56.57% | 56.57% | 1 | 100.00% | 0 | 0 |
| best_ef_close6 | post_from_2025_08 | BULL | 56.57% | 56.57% | 56.57% | 1 | 100.00% | 0 | 0 |

## Readout

- Regime labels use signal-date KOSPI/KOSDAQ trend, breadth, volatility, and liquidity only.
- `best_ef_close6` is current original-model retest candidate from post exit grid.
- Next decision: tighten SIDEWAYS or block BEAR/CRASH if breakdown shows weak expectancy.
- Trades: `.Codex/reports/2026-05-27_w4-v3fin-regime-breakdown-trades.csv`
