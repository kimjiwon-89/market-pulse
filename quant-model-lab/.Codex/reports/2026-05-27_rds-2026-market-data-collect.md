# RDS 2026 Market Data Collect

date: 2026-05-27

## Scope

- Requested range: 2026-01-01~2026-05-27
- Executed through production API: `POST /api/quant/collect`
- Data types requested: `STOCK`, `INDEX`, `BOND`, `GOLD`, `ETF`, `ETN`

## Result

| asset_type | min_date | max_date | rows | trading days |
|---|---|---|---:|---:|
| GOLD | 2026-01-02 | 2026-05-26 | 96 | 96 |
| INDEX | 2026-01-02 | 2026-05-26 | 192 | 96 |
| STOCK | 2026-01-02 | 2026-05-26 | 266,230 | 96 |

Monthly STOCK/INDEX coverage:

| month | stock days | stock rows | index days | index rows |
|---|---:|---:|---:|---:|
| 2026-01 | 21 | 58,420 | 21 | 42 |
| 2026-02 | 17 | 47,118 | 17 | 34 |
| 2026-03 | 21 | 58,171 | 21 | 42 |
| 2026-04 | 22 | 60,975 | 22 | 44 |
| 2026-05 | 15 | 41,546 | 15 | 30 |

Recent trading days:

| trade_date | stock rows | index rows | gold rows |
|---|---:|---:|---:|
| 2026-05-18 | 2,770 | 2 | 1 |
| 2026-05-19 | 2,769 | 2 | 1 |
| 2026-05-20 | 2,770 | 2 | 1 |
| 2026-05-21 | 2,770 | 2 | 1 |
| 2026-05-22 | 2,770 | 2 | 1 |
| 2026-05-26 | 2,770 | 2 | 1 |

## Notes

- 2026-05-27 was requested, but KRX returned 0 insertable rows for that date. Current RDS max trading date is 2026-05-26.
- `BOND`, `ETF`, and `ETN` collection jobs completed, but no insertable rows were present in `market_daily_price` after the run.
- Bull V4 required data is now present for 2026 through the latest available KRX trading date: `STOCK` plus `KOSPI`/`KOSDAQ` `INDEX`.
