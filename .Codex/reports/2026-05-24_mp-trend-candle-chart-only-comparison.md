# MP_TREND_CANDLE Chart-Only Comparison

date: 2026-05-24
status: COMPLETED
period: 2022-05-01 ~ 2025-06-30

## Scope

- Compared `MP_CORE_SIGNAL`, `CANDLE_BREAKOUT_V1`, and `CANDLE_PULLBACK_V1`.
- The candle strategies use `quant_candle_feature_snapshot`, generated from `market_daily_price` OHLCV only.
- The candle strategies do not use `quant_core_feature_snapshot`, MP_CORE factor scores, investor-flow rules, value/quality factors, or existing MP_CORE selection rules.
- Local DB has no `INDEX/KOSPI` rows in `market_daily_price`; candle strategy regime filter is therefore fail-open for `UNKNOWN` regime.

## Result

| Strategy | Start | End | Months | Avg Picks | Total Return | Monthly Compound | MDD | Win Rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| MP_CORE_SIGNAL | 2022-05-31 | 2025-06-30 | 38 | - | 22.60% | 0.54% | -57.77% | 47.37% |
| CANDLE_BREAKOUT_V1 | 2022-05-02 | 2025-06-02 | 38 | 9.63 | -79.63% | -4.10% | -82.37% | 36.84% |
| CANDLE_PULLBACK_V1 | 2022-05-02 | 2025-06-02 | 38 | 10.00 | -65.68% | -2.77% | -70.24% | 34.21% |

## Verdict

- V1 chart-only candle strategies are not deployable as-is.
- `CANDLE_PULLBACK_V1` is materially better than breakout, but still far worse than MP_CORE.
- The current filter set selects weak continuation names in the local Korean equity universe; the next useful iteration should tune exit/stop logic and add market-regime data before expanding strategy variants.

## Tuning Update

| Strategy | Total Return | Monthly Compound | MDD | Active Months |
|---|---:|---:|---:|---:|
| CANDLE_MOMENTUM_H20_V1 | 47.29% | 1.02% | -28.38% | 30 / 38 |

- Rule: chart-only momentum near 60-day high, positive 20/60-day returns, volume expansion, range cap, 20-trading-day hold.
- This is the first tested chart-only variant above the 1% monthly compound target.

## Verification

- `quant_candle_feature_snapshot` rows: 98,895
- signal dates: 38 monthly dates, 2022-04-29 ~ 2025-05-30
- assets: 2,892
- `xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test`: PASS
- `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile`: PASS
