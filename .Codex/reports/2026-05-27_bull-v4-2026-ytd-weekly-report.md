# Bull V4 2026 YTD Weekly Report

date: 2026-05-27
model: `BULL_V4`
runtime_config: `BULL_V4_BALANCED_PAPER`
source: local `market_daily_price` after KRX collect
capital: 1,000,000,000 KRW
position_cash: 100,000,000 KRW

## Data Coverage

| asset_type | rows | first_date | latest_date | trading_days |
|---|---:|---|---|---:|
| GOLD | 96 | 2026-01-02 | 2026-05-26 | 96 |
| INDEX | 192 | 2026-01-02 | 2026-05-26 | 96 |
| STOCK | 266,230 | 2026-01-02 | 2026-05-26 | 96 |

KRX returned no insertable daily market rows for 2026-05-27, so the latest replayable market date is 2026-05-26.

## Runtime Summary

| metric | value |
|---|---:|
| cached replay facts | 1 |
| completed trades | 1 |
| wins | 0 |
| total P/L | -6,300,000 KRW |
| capital return | -0.63% |
| latest report time | 2026-04-24 15:45 |
| runtime status | RUNNING |

## Trade Log

| entry_date | exit_date | code | name | entry_price | exit_price | return | P/L | score |
|---|---|---|---|---:|---:|---:|---:|---:|
| 2026-04-22 | 2026-04-24 | 138080 | 오이솔루션 | 45,300.0000 | 42,446.1000 | -6.30% | -6,300,000 | 3.02503559 |

## Weekly Report

| ISO week | week_start | trades | wins | avg trade return | capital return | P/L |
|---|---|---:|---:|---:|---:|---:|
| 2026W17 | 2026-04-20 | 1 | 0 | -6.30% | -0.63% | -6,300,000 |

## Readout

- The patched runtime now uses the Bull V4 cached replay fact path, not the old daily momentum placeholder.
- The year-to-date run generated one completed Bull V4 trade through the latest available KRX market date.
- The only completed trade was a loss in `2026W17`, so the weekly report has one warning and no winning exits.
- The model page API now reports `BULL_V4` as `RUNNING` with 1 raw/entry candidate and -0.63% capital return.
- There are no May completed replay exits yet, so the monthly return currently remains 0.00% in the May-focused dashboard field.
