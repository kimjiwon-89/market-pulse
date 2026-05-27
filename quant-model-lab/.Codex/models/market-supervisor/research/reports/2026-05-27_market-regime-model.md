# Market Regime Model Snapshot

date: 2026-05-27
period: 2012-03-28 ~ 2026-05-26
total_dates: 3477

## Regime Distribution

| regime | days | pct |
|---|---:|---:|
| BULL | 1325 | 38.1% |
| SIDEWAYS | 1322 | 38.0% |
| BEAR | 824 | 23.7% |
| CRASH | 6 | 0.2% |

## Yearly Regime Distribution

| year | BULL | SIDEWAYS | BEAR | CRASH | total |
|---:|---:|---:|---:|---:|---:|
| 2012 | 47 | 77 | 65 | 0 | 189 |
| 2013 | 84 | 103 | 60 | 0 | 247 |
| 2014 | 62 | 150 | 33 | 0 | 245 |
| 2015 | 105 | 97 | 46 | 0 | 248 |
| 2016 | 81 | 113 | 52 | 0 | 246 |
| 2017 | 121 | 100 | 22 | 0 | 243 |
| 2018 | 62 | 94 | 88 | 0 | 244 |
| 2019 | 102 | 62 | 82 | 0 | 246 |
| 2020 | 154 | 48 | 40 | 6 | 248 |
| 2021 | 80 | 120 | 48 | 0 | 248 |
| 2022 | 53 | 69 | 124 | 0 | 246 |
| 2023 | 108 | 95 | 42 | 0 | 245 |
| 2024 | 53 | 102 | 89 | 0 | 244 |
| 2025 | 155 | 60 | 27 | 0 | 242 |
| 2026 | 58 | 32 | 6 | 0 | 96 |

## Avg Indicators by Regime

| regime | breadth_ma20 | volatility_20 | liquidity_trend | bull_score | bear_score |
|---|---:|---:|---:|---:|---:|
| BULL | 0.596 | 0.0113 | 0.077 | 8.0 | 0.6 |
| SIDEWAYS | 0.429 | 0.0125 | -0.017 | 4.5 | 2.7 |
| BEAR | 0.289 | 0.0167 | -0.064 | 1.6 | 5.4 |
| CRASH | 0.058 | 0.0500 | 0.223 | 0.8 | 6.2 |

## Notes

- Regime uses signal-date data only (no look-ahead).
- `breadth_ma20` = fraction of STOCK universe with close > MA20.
- `volatility_20` = max(KOSPI_vol20, KOSDAQ_vol20) daily return stddev.
- `liquidity_trend` = current total trade amount / 20d avg - 1.
- Snapshot CSV: `.Codex/reports/2026-05-27_market-regime-snapshot.csv`
- Same classifier used for realtime backend snapshot flow.
