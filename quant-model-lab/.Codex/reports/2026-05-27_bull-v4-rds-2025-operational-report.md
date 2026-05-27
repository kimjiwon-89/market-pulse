# Bull V4 RDS 2025 Weekly Operational Report

date: 2026-05-27
source: RDS `market_daily_price`, exported 2024-09-01~2025-12-31 for 2025 replay
capital: 1,000,000,000
position_cash: 100,000,000
model: `BULL_V4_BALANCED_PAPER_ap06`

## Summary

| scope | trades | total on capital | avg month | best month | worst month | months >=20% | avg week | best week | weeks >=20% | win | active entry days | entry days >=2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| patched_2025 | 28 | 43.29% | 4.33% | 19.24% | -2.63% | 0/10 | 2.28% | 15.49% | 0/19 | 53.57% | 26 | 2 (7.69%) |
| patched_post | 13 | 15.90% | 3.98% | 19.24% | -2.63% | 0/4 | 2.27% | 7.51% | 0/7 | 53.85% | 12 | 1 (8.33%) |
| old_2025 | 242 | -42.63% | -3.55% | 2.34% | -13.06% | 0/12 | -0.80% | 2.95% | 0/53 | 40.91% | 242 | 0 (0.00%) |
| old_post | 101 | -15.08% | -3.02% | 2.34% | -13.06% | 0/5 | -0.66% | 2.34% | 0/23 | 43.56% | 101 | 0 (0.00%) |

## Latest Weekly Rows

| model | week | trades | capital return | avg trade return | wins |
|---|---|---:|---:|---:|---:|
| old_daily_momentum | 2025W40 | 4 | -6.75% | -16.88% | 0 |
| old_daily_momentum | 2025W41 | 1 | -1.00% | -10.00% | 0 |
| old_daily_momentum | 2025W42 | 5 | -0.68% | -1.35% | 1 |
| patched_ap06 | 2025W42 | 1 | 0.66% | 6.56% | 1 |
| old_daily_momentum | 2025W43 | 5 | -4.20% | -8.39% | 2 |
| old_daily_momentum | 2025W44 | 5 | -1.23% | -2.46% | 1 |
| old_daily_momentum | 2025W45 | 5 | 1.62% | 3.24% | 5 |
| patched_ap06 | 2025W45 | 2 | -1.86% | -9.30% | 0 |
| old_daily_momentum | 2025W46 | 5 | -1.29% | -2.58% | 3 |
| patched_ap06 | 2025W46 | 2 | -0.77% | -3.87% | 1 |
| old_daily_momentum | 2025W47 | 5 | 1.26% | 2.51% | 3 |
| old_daily_momentum | 2025W48 | 5 | -2.01% | -4.01% | 0 |
| old_daily_momentum | 2025W49 | 5 | 2.32% | 4.64% | 5 |
| old_daily_momentum | 2025W50 | 5 | 1.58% | 3.15% | 2 |
| patched_ap06 | 2025W50 | 2 | 4.91% | 24.54% | 2 |
| old_daily_momentum | 2025W51 | 5 | -0.24% | -0.48% | 2 |
| old_daily_momentum | 2025W52 | 4 | -0.62% | -1.54% | 1 |
| patched_ap06 | 2025W52 | 2 | 7.51% | 37.57% | 2 |
| old_daily_momentum | 2026W01 | 2 | -0.70% | -3.51% | 0 |
| patched_ap06 | 2026W01 | 2 | 6.82% | 34.09% | 1 |

## Readout

- The patched model is compared against the old homepage placeholder reconstructed as 5-day daily momentum top-1, same-day close.
- The 20% threshold is evaluated on capital, not single-position trade return.
- The 2-per-day threshold is evaluated on actual entry dates.
- 2025 patched result is profitable and much cleaner than the old placeholder, but it does **not** meet a stable 20% return threshold on weekly/monthly capital return.
- Best patched month is 19.24%, so it is close to but still below the 20% capital-return target; best patched week is 15.49%.
- Patched entry flow is sparse: 28 trades in 2025, 26 active entry days, only 2 days with 2 entries. It does **not** produce 2+ stocks every day.
- The old uploaded/homepage-style placeholder is frequent but poor quality: 242 daily trades in 2025 with -42.63% total capital return.
- Trades CSV: `.Codex/reports/2026-05-27_bull-v4-rds-2025-operational-trades.csv`
- Weekly CSV: `.Codex/reports/2026-05-27_bull-v4-rds-2025-weekly.csv`
