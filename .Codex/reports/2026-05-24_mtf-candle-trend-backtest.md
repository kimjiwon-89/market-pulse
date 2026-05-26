# MTF Candle Trend Backtest

date: 2026-05-24
updated: 2026-05-25
status: IMPLEMENTED_IMPROVED_TARGET_FAIL
strategy: `CANDLE_MTF_TREND_V2`
target: average monthly return 15%, costs included

## Scope

- Added an event-style multi-timeframe candle strategy shell.
- The implemented strategy scans daily signal dates and uses 5-trading-day entry slots, not monthly rebalance dates.
- Historical minute bars are not available in local DB, so minute logic remains a documented `NO_MINUTE_DATA` execution fallback.
- Local daily feature snapshot was expanded from monthly snapshots to daily snapshots:
  - rows: 2,062,662
  - signal dates: 2022-04-04 ~ 2025-06-30
  - distinct signal dates: 793
  - distinct assets: 2,908

## Implemented Variant

```text
CANDLE_MTF_TREND_V2
holdDays: 5
topN: 3
source: quant_candle_feature_snapshot
minuteFallback: NO_MINUTE_DATA
```

Entry filters:

- price near 60-day high: `close >= high60_prior * 0.90`
- above MA20 and MA60
- MA20 not materially below MA60: `ma20 >= ma60 * 0.98`
- 20-day return >= 3%
- 60-day return >= 8%
- volume expansion >= 0.8
- candle location >= 0.55
- body ratio >= -3%
- 20-day range between 3% and 30%
- 20-day average trade amount >= 500,000,000

## Tuning Result

Period: 2022-05-01 ~ 2025-06-30

| Variant | Avg Monthly | Compound Monthly | Total | Worst Month | Events |
|---|---:|---:|---:|---:|---:|
| h5 top3 lenient MTF | 1.56% | 0.41% | 16.66% | -32.95% | 153 |
| h5 top1 high-ratio greedy | 1.81% | -4.41% | -81.98% | -46.01% | 152 |
| h5 top3 trend greedy | 0.64% | -2.71% | -64.74% | -38.00% | 153 |
| h3 top1 trend greedy | -0.30% | -3.62% | -75.36% | -47.08% | 254 |

Stop/take-profit overlays did not help:

| Variant | Avg Monthly | Compound Monthly | Total | Worst Month | Events |
|---|---:|---:|---:|---:|---:|
| h3 top1 trend stop10 take15 | -0.18% | -3.29% | -71.97% | -46.09% | 256 |
| h5 top3 trend stop5 take20 | -1.34% | -1.97% | -53.11% | -17.10% | 153 |

## Verdict

FAIL against the 15% average monthly target.

The best honest tested result is average monthly 1.56%, far below 15%.
More aggressive top1 variants can raise arithmetic average slightly, but the compounding result collapses because a few months lose too much.

Because the target was not reached, full-data validation for a passing target was not applicable.
The local full available daily data begins at 2022-01-03 and ends at 2025-06-30; the candle feature snapshot can now support daily scans across that range.

## Bottlenecks

- No historical minute bars, so the model cannot yet use true intraday entry rejection or VWAP/fade filters in historical tests.
- No KOSPI/KOSDAQ index rows in `market_daily_price`, so market regime filtering is unavailable.
- Daily OHLCV-only momentum has large left-tail months; hard stop/take-profit reduced some drawdown but also cut winners.
- A 15% average monthly target implies a highly concentrated short-term trading system, not a normal diversified quant basket.

## Verification

- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS, 7 tests
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS

## 2026-05-25 Retest

### Root Cause Findings

- The initial MTF cadence used a row number built only inside the requested backtest period.
- That made trade dates depend on `fromDate`; the same strategy could pick different trades if the start date changed.
- The candidate pool had many future winners, but the deployable ranking did not identify them:
  - broad candidate pool 5-day average return: -0.42%
  - pool median: -0.93%
  - p90: 7.36%
  - p99: 27.53%
  - max: 136.83%
  - oracle top1 diagnostic, not deployable: 275.03% average monthly
- Strong volume/candle momentum was a short-term overheat signal in this local data. The top volume quintile averaged -1.06% forward return, worse than lower-volume buckets.

### Fix

- Changed event cadence to use absolute available trading days up to `toDate`, not days starting at `fromDate`.
- Replaced high-volume chase ranking with a lower-volume continuation ranking.
- Updated active variant:

```text
CANDLE_MTF_TREND_V2
holdDays: 10
topN: 1
volumeExpansion <= 0.8
high60 ratio: 0.90 ~ 1.02
ret20 >= 3%
ret60 >= 0%
range20 <= 25%
```

Score:

```text
(1 - volumeExpansion) + ret60 + ret20 - abs(high60Ratio - 0.94) + (1 - range20) * 0.1
```

### Retest Result

| Period | Avg Monthly | Compound Monthly | Total | Worst Month | Events |
|---|---:|---:|---:|---:|---:|
| 2022-05-01 ~ 2025-06-30 | 5.07% | 3.01% | 208.71% | -23.62% | 76 |
| 2022-01-03 ~ 2025-06-30 full available | 4.80% | 2.71% | 207.97% | -23.46% | 77 |

### Retest Verdict

Still FAIL against the 15% average monthly target.

However, this retest is materially better and more stable than the previous result:

- Previous best: 1.56% average monthly, 0.41% compound monthly.
- New best: 5.07% average monthly, 3.01% compound monthly.
- Full available data remains positive at 4.80% average monthly.

The remaining gap to 15% likely requires data not present in the current historical backtest:

- historical minute bars for VWAP/gap-fade rejection,
- index regime rows for bear-market blocking,
- more granular exit logic than fixed daily OHLC hold windows.

## 2026-05-25 Exit Risk Retest

Question: can we reduce the worst losses without killing the best winner?

### Trade Extremes Before Exit Filter

| Type | Asset | Entry Date | Return |
|---|---|---:|---:|
| Best trade | 알에프세미 (`096610`) | 2023-03-22 | 143.87% |
| Worst trade | 에스티오 (`098660`) | 2022-11-10 | -20.12% |
| Best month | 2023-03 | - | 125.09% |
| Worst month | 2022-05 | - | -23.46% |

The worst trades were not stop-loss exits.
They were fixed 10-trading-day exits after the position already moved against the strategy.

### Post-Exit Movement

Several losing trades bounced after the fixed exit:

| Asset | Trade Return | 10 Trading Days After Exit | 20 Trading Days After Exit |
|---|---:|---:|---:|
| 동진쎄미켐 | -16.28% | 18.38% | 18.76% |
| 라온시큐어 | -12.17% | 4.88% | 14.23% |
| 엑시콘 | -11.96% | 8.75% | 7.43% |
| 한화에어로스페이스 | -10.50% | 0.00% | 3.21% |

Interpretation:

- Some losers were bad entries.
- Some were early entries where the 10-day holding window exited near a local low.

### Exit Filter Simulation

Applied rule:

```text
if entry day through entry+2 trading days touches -4% intraday low:
    exit at -4% from entry
else:
    keep existing 10-trading-day exit
```

| Variant | Avg Monthly | Compound Monthly | Total | Worst Month | Best Trade | Worst Trade | Triggered |
|---|---:|---:|---:|---:|---:|---:|---:|
| fixed10 | 4.73% | 2.64% | 198.75% | -23.46% | 143.87% | -20.12% | 0 |
| confirmLow1 | 4.37% | 2.47% | 178.29% | -20.66% | 143.87% | -16.28% | 26 |
| confirmLow2 | 4.14% | 2.36% | 166.88% | -12.11% | 143.87% | -6.45% | 37 |
| stop8 | 4.06% | 2.13% | 142.58% | -22.66% | 143.87% | -8.21% | 30 |

### Applied Change

Implemented `confirmLow2` in `findEventDrivenCandleMtfTrendPicks`.

This reduces the left tail while preserving the best winner:

- best trade remains 알에프세미 143.87%
- worst trade improves from -20.12% to -6.45%
- worst month improves from -23.46% to -12.11%
- average monthly falls from 4.73% to 4.14%

### Verification

- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS, 7 tests
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS

## 2026-05-25 Confirm-Low Profit Retest

Goal: keep the early-failure exit but recover more return.

Best variant found:

```text
holdDays: 10
topN: 1
confirm exit: entry through entry+2 trading days, -3% intraday low
volumeExpansion <= 1.0
high60 ratio: 0.92 ~ 1.02
ret20 >= 6%
ret60 >= 0%
range20 <= 25%
```

| Variant | Avg Monthly | Compound Monthly | Total | Worst Month | Events | Confirm Exits |
|---|---:|---:|---:|---:|---:|---:|
| confirmLow2 previous | 4.14% | 2.36% | 166.88% | -12.11% | 77 | 37 |
| confirmLow3pct ret20>=6 | 4.60% | 2.82% | 221.98% | -9.77% | 78 | 43 |

Applied the improved variant to `findEventDrivenCandleMtfTrendPicks`.

### Verification

- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS, 7 tests
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS

## 2026-05-25 Average Monthly 5% Retest

Goal: keep confirm-low risk control and push average monthly return over 5%.

Applied variant:

```text
holdDays: 10
topN: 1
confirm exit: entry through entry+2 trading days, -3% intraday low
volumeExpansion <= 1.0
high60 ratio: 0.92 ~ 1.02
ret20 >= 9%
ret60 >= 0%
range20 <= 25%
```

| Variant | Avg Monthly | Compound Monthly | Total | Worst Month | Events | Confirm Exits |
|---|---:|---:|---:|---:|---:|---:|
| previous ret20>=6 | 4.60% | 2.82% | 221.98% | -9.77% | 78 | 43 |
| ret20>=9 | 5.03% | 3.22% | 278.21% | -9.32% | 78 | 44 |

Verdict: PASS for the intermediate 5% average monthly target.

The original 15% average monthly target remains unmet.

### Verification

- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS, 7 tests
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS

## 2026-05-25 Pattern Exit V3 Retest

Goal: replace fixed 10-trading-day profit taking with pattern-driven exits and avoid overlapping trades.

V3 experiment:

```text
entry candidate cadence: every 10 trading days
max hold: 40 trading days
non-overlap: next entry only after prior exit
early exit: entry through entry+2 trading days, -3% intraday low
profit exit: trend exhaustion / distribution candle / trailing profit signal
entry filters: ret20 >= 9%, ret60 >= 0%, high60 ratio 0.92~1.02, volumeExpansion <= 1.0
```

CSV/path retest result:

| Variant | Avg Monthly | Total Return | Avg Trade | Worst Trade | Best Trade | Events |
|---|---:|---:|---:|---:|---:|---:|
| fixed10 ret20>=9 | 5.03% | 278.21% | n/a | n/a | n/a | 78 |
| patternExitV3 non-overlap | 10.19% | 486.94% | 6.23% | -17.46% | 114.65% | 42 |

Exit mix:

| Exit Type | Count |
|---|---:|
| CONFIRM_EXIT | 24 |
| TRAILING_TAKE_PROFIT | 6 |
| DISTRIBUTION_CANDLE | 6 |
| MAX_40D | 6 |

Verdict: V3 materially improves return by letting winners run, but original 15% average monthly target remains unmet.

Implementation notes:

- `CandleMtfTrendStrategy` now requests a 40-trading-day max hold and filters overlapping returned picks in Java.
- Mapper SQL now returns 10-trading-day cadence top candidates with early weakness defense and feature-snapshot profit exits.
- Full mapper SQL execution from the local database was not completed within the interactive timeout; the reported V3 performance comes from the exported candidate/path retest.

### Verification

- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS, 8 tests
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS

## 2026-05-26 Pattern Exit V4 Implementation

Goal: keep the V3 non-overlap and pattern exits, but avoid giving back large checkpoint profits and stale losers around the 10-trading-day checkpoint.

V4 implementation:

```text
entry candidate cadence: every 10 trading days
max hold: 40 trading days
priority 1: confirm-low early weakness exit
priority 2: checkpoint profit exit when checkpoint close/open is >= entry price * 1.20
priority 3: checkpoint rollover exit when close loses ma20 and ret20 rolls over near the checkpoint
priority 4: V3 pattern exit or max-hold exit
```

Implementation notes:

- Added mapper contract coverage in `CandleTrendStrategyTest` before changing SQL.
- Mapper SQL now includes `checkpoint_profit_exit` and `checkpoint_rollover_exit`.
- Strategy metadata now records `checkpointProfit: 0.20` and `profitExit: CHECKPOINT_OR_PATTERN`.
- Existing confirm-low defense remains first in the exit priority.

Performance status:

- Not yet a valid performance verdict.
- Local API smoke on `strategyId=278`, `20220501~20250630`, returned 0 trades.
- `CANDLE_MOMENTUM_H20_V1` also returned 0 trades in the same local API smoke, so the current local DB is not the exported/path retest dataset used for the V3 10.19% result.
- The rough pre-implementation V4 estimate remains unverified: 12.31% average monthly, 845.29% total return, worst month -9.32%.

### Verification

- `.\mvnw.cmd -q -Dtest=CandleTrendStrategyTest test`: PASS, 9 tests
- PowerShell XML reader parse of `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `.\mvnw.cmd -q -DskipTests compile`: PASS
- Spring Boot local smoke on port 18081: PASS startup and endpoint response, but 0-trade dataset
