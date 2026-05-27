# Bull V4 Runtime Replay Fix

date: 2026-05-27
branch: feature/bull-v4-runtime-replay

## Summary

Homepage Bull V4 was not running the frozen V4/W4/V3-FIN replay. It was using a temporary 5-day momentum top-1 daily replay through `findDailyMomentumReplayPicks`.

This patch changes the runtime provider to call a dedicated Bull V4 paper replay query.

## Runtime Rule Set

Initial runtime target is the balanced paper candidate:

```text
entry_delay_days: 5
entry_loc_min: 0.55
entry_ma20_dist_min: 0.02
entry_next_body_min: 0.005
range20_max: 0.40
top_n: 50 raw candidates
max_buys_per_signal_day: 5
regime_gate: KOSPI > MA20 and KOSDAQ > MA20
source_label: BULL_V4_REPLAY
```

Exit target:

```text
early_fail: first 3 days close <= -6%, net -6.3%
stop: low <= -12%, net -12.3%
trail: peak >= +20%, close <= peak -20%
conditional extension: day 30 return >= +25% and close > MA20, max 60 days
cost: 0.3%
```

## Changed Files

- `backend-quant/live/service/MarketDailyPriceReplayProvider.java`
- `backend-quant/live/service/LiveQuantSimulationService.java`
- `backend-quant/mapper/MarketDailyPriceMapper.java`
- `backend-quant-mappers/MarketDailyPriceMapper.xml`
- `backend-quant-tests/live/MarketDailyPriceReplayProviderTest.java`
- `backend-quant-tests/live/LiveQuantSimulationServiceTest.java`

## Verification

Passed:

```text
sh ./mvnw -Dtest=LiveQuantSimulationServiceTest,MarketDailyPriceReplayProviderTest test
```

Result:

```text
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
```

Manual SQL parse/run against local DB also passed, but returned 0 closed trades for 2026-05-01~2026-05-27.

Reason:

```text
local market_daily_price range: 2022-01-03~2025-06-30
local asset_type present: STOCK only
INDEX rows present: none
```

Bull V4 requires `KOSPI` and `KOSDAQ` index rows for its BULL regime gate, so the local DB cannot validate final May 2026 replay results yet.

## RDS Verification

RDS data health:

```text
market_daily_price range: 2010-01-04~2026-05-21
asset types: STOCK, INDEX, GOLD
KOSPI/KOSDAQ index rows: present
```

Important caveat:

```text
2026-01~2026-04 market_daily_price rows are missing.
2026-05 has only 3 trading days through 2026-05-21.
```

RDS 2026-05-01~2026-05-21 staged replay:

```text
raw_candidates: 0
signal_day_ranked: 0
entry_confirmed: 0
picked_top5: 0
```

This is caused by sparse May data, not by the local DB issue.

RDS monthly closed replay smoke:

| month | closed trades | avg return | sum return | first entry | last exit |
|---|---:|---:|---:|---|---|
| 2025-08 | 0 | - | - | - | - |
| 2025-09 | 0 | - | - | - | - |
| 2025-10 | 1 | 9.11% | 9.11% | 2025-10-21 | 2025-10-31 |
| 2025-11 | 2 | 28.74% | 57.47% | 2025-11-11 | 2025-11-28 |
| 2025-12 | 0 | - | - | - | - |

Performance note:

```text
1-month replay is acceptable for smoke testing.
multi-month replay still times out near 120 seconds.
```

Applied SQL runtime improvement:

```text
lookback window: 500 days -> 180 days
materialized CTEs: trading_days, stock_base, stock_features, index_features,
                  index_regime, raw_candidates, signal_days, raw_ranked
```

## 50% Candidate Comparison

Reference candidate:

```text
variant: ef_close6_cond_ext60
train: 2022-05-01~2025-07-31
train N: 6
train avg monthly: 52.10%
train win: 83.33%
post N: 1
post avg: 56.57%
```

Reference train/post trades:

| period | signal | code | name | entry | exit | return | reason |
|---|---|---:|---|---|---|---:|---|
| train | 2022-11-14 | 004360 | 세방 | 2022-11-22 | 2023-02-17 | 109.54% | MAX |
| train | 2023-03-24 | 009730 | 코센 | 2023-04-03 | 2023-05-04 | 61.77% | TRAIL |
| train | 2023-05-23 | 336570 | 원텍 | 2023-06-01 | 2023-08-28 | 66.45% | MAX |
| train | 2024-05-02 | 175140 | 휴먼테크놀로지 | 2024-05-13 | 2024-06-26 | 7.50% | MAX |
| train | 2024-12-12 | 285490 | 노바텍 | 2024-12-20 | 2025-03-06 | -0.17% | TRAIL |
| train | 2025-05-09 | 082270 | 젬백스 | 2025-05-19 | 2025-07-02 | 67.49% | MAX |
| post | 2025-09-17 | 089890 | 코세스 | 2025-09-25 | 2025-11-25 | 56.57% | TRAIL |

Why homepage/runtime results differ:

1. The 52.10% candidate is not the same parameter family as the balanced runtime config.

```text
52% reference:
  range20 <= 0.55
  entry_loc >= 0.65
  entry_ma20_dist >= 0.05
  entry_next_body >= 0.01
  top_n = 10
  one open position lock
  candidate-date cadence >= 5 trading days

runtime balanced config:
  range20 <= 0.40
  entry_loc >= 0.55
  entry_ma20_dist >= 0.02
  entry_next_body >= 0.005
  top_n = 50
  up to 5 buys per signal day
```

2. The headline metric is different.

The 52.10% report is a concentrated single-slot research metric that sums trade returns by exit month. The newer balanced reports normalize PnL against 1B capital with 100M per position. A 52% single-position return month is roughly 5.2% on 1B capital if only 100M is allocated.

3. Runtime SQL had a signal cadence bug.

Previous runtime SQL used every fifth global trading day:

```text
((day_seq - 1) % 5) = 0
```

The research script uses candidate-date cadence:

```text
first raw candidate date, then next raw candidate date at least 5 trading days later
```

This can skip the actual winner signal dates, including the sparse high-return dates that created the 52.10% result. Runtime SQL was changed to derive `signal_days` from raw candidate dates with recursive 5-day cadence.

4. RDS 2026 data is incomplete.

RDS cannot reproduce a May 2026 homepage result because 2026-01~04 are missing and May 2026 has only 3 trading days.

5. Long-range SQL replay is still too slow.

RDS single-month smoke works in some windows, but multi-month and several winner-month checks hit the 120s timeout. This confirms the homepage should not run long-range Bull V4 replay as a raw SQL CTE on demand.

## Decision From Comparison

For production/homepage:

```text
short term:
  keep DATA_DELAYED when no BULL_V4_REPLAY facts exist
  do not compare May 2026 until RDS 2026 daily/index data is complete

next implementation:
  precompute/cache Bull V4 paper replay facts
  store signal_date, entry_check_date, entry_date, exit_date, config_key
  expose both concentrated research metric and capital-normalized metric separately

config:
  keep balanced config for broader paper monitoring
  keep ef_close6_cond_ext60 as a separate shadow/high-conviction config
```

## 1B / 10-Position Portfolio Comparison

Portfolio expansion premise:

```text
capital: 1,000,000,000 KRW
position_cash: 100,000,000 KRW
max_positions: 10
max_buys_per_day: 5
liquidity cap: 3% of signal-day trade amount
```

The old 52.10% headline and the 1B/10-position model are not the same denominator.

| model | period | trades | active months | active-month avg on capital | calendar avg on capital | total on capital | worst month | win |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `ef_close6_cond_ext60` single-slot, 100M/1B normalized | train | 6 | 6 | 5.21% | 0.80% | 31.26% | -0.02% | 83.33% |
| `relaxed_d5_loc55_ma2_nb0_top50` 1B/10-position | train | 51 | 22 | 2.41% | 1.03% | 52.99% | -2.46% | 37.25% |
| `current_entry_top20` 1B/10-position | train | 34 | 17 | 2.17% | 0.94% | 36.85% | -2.46% | 44.12% |
| `ap06_range040_next005` 1B/10-position | train | 38 | 20 | 3.15% | 1.25% | 63.02% | -2.46% | 50.00% |
| `ap10_range040_ret60max080` 1B/10-position | train | 26 | 14 | 4.51% | 1.22% | 63.10% | -2.46% | 61.54% |

Post sample:

| model | period | trades | active months | active-month avg on capital | calendar avg on capital | total on capital | worst month | win |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `ef_close6_cond_ext60` single-slot, 100M/1B normalized | post | 1 | 1 | 5.66% | 0.57% | 5.66% | 0.00% | 100.00% |
| `relaxed_d5_loc55_ma2_nb0_top50` 1B/10-position | post | 16 | 5 | 16.47% | 8.23% | 82.34% | -3.21% | 62.50% |
| `current_entry_top20` 1B/10-position | post | 13 | 5 | 16.75% | 8.37% | 83.75% | -1.81% | 69.23% |
| `ap06_range040_next005` 1B/10-position | post | 28 | 9 | 5.84% | 5.26% | 52.60% | -2.63% | 57.14% |
| `ap10_range040_ret60max080` 1B/10-position | post | 19 | 7 | 5.73% | 4.01% | 40.13% | -1.36% | 57.89% |

Readout:

- The 52.10% old candidate becomes about **5.21% active-month average on 1B capital** when each position is 100M.
- The old candidate looks spectacular because it is extremely concentrated: 6 train trades, 5 winners, no early fail/stop in train.
- The 10-position portfolio gives up single-trade purity but improves capital deployment. Train total on capital rises from 31.26% normalized single-slot to 52.99% in the broad portfolio and 63% in the applied variants.
- Post behavior is the opposite of the old headline story: the old candidate has only 1 post trade, while the 10-position models produce 13~28 post trades and much higher total on capital.
- Best balance from this comparison is not the raw sample-expansion rank 1. `ap06` and `ap10` are better candidates for paper monitoring because they keep train total near 63% and improve win rate/overextension control.

Decision:

```text
Use two configs, not one:

HIGH_CONVICTION_SHADOW = ef_close6_cond_ext60
  purpose: preserve the old 50% research candidate and audit exact winners

BALANCED_PAPER = ap06_range040_next005 or ap10_range040_ret60max080
  purpose: 1B/10-position paper monitoring with realistic capital denominator
```

## Next Improvements

- Add/verify index collection into `market_daily_price` before judging Bull V4 homepage results.
- Runtime now reports `DATA_DELAYED` when cached `BULL_V4_REPLAY_BALANCED_PAPER` has no closed facts.
- Added `quant_bull_v4_replay_fact` cache table and `POST /api/quant/live/bull-v4/replay/precompute?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`.
- If `fromDate` is omitted, the precompute API refreshes `toDate - 120 days` through `toDate`.
- Added `GET /api/quant/live/bull-v4/replay/cache-status` for cache row count, first/latest exit date, last update timestamp, and readiness.
- Added weekday 16:30 KST scheduler to refresh the last 120 calendar days after the quant daily/ETF/ETN collectors.
- Runtime now reads cached replay facts instead of running the long Bull V4 replay CTE on homepage requests.
- Runtime capital accounting now uses 1B seed and 100M position cash, so total/monthly return are shown on the same denominator as the 10-position paper model.
- RDS cache table was created on 2026-05-27; it is currently empty because 2026-05 RDS data has only 3 trading days and the completed replay window has no facts.
- Add open candidate/position view for current-month V4, because completed trades may be empty during the 5-day delay and up-to-60-day holding window.
- Compare runtime replay trade set against research CSV after RDS has the same 2026 stock and index date range.
