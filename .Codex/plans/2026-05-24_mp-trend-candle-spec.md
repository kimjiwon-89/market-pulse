# MP_TREND_CANDLE Strategy Spec

date: 2026-05-24
status: APPROVED_FOR_PLANNING
source idea: 성승현, 《캔들차트 하나로 끝내는 추세추종 투자》, 포르체
scope: chart/candle trend-following backtest strategies

## Objective

Create a separate chart-based trend-following strategy family beside `MP_CORE`.

Important user direction:

- The new model must not reuse MP_CORE scoring rules, MP_CORE feature weights, factor ranks, investor-flow rules, value/quality logic, or quant-core model assumptions.
- The new model is a pure chart/technical-trading model.
- Allowed inputs are OHLCV-derived technical fields and market index OHLCV-derived regime fields only.
- `MP_CORE_SIGNAL` can be used only as an external benchmark for reporting, not as an input, filter, or model component.

The first iteration compares two candle-driven variants against the existing MP_CORE signal strategy:

- `CANDLE_BREAKOUT_V1`: buy strength when price breaks out from a prior range.
- `CANDLE_PULLBACK_V1`: buy continuation when an existing uptrend pulls back and rebounds.

This is not a claim to reproduce the book's proprietary method exactly. It translates the public concept and user intent into reproducible OHLCV rules that can be tested in Market Pulse.

## Baseline Comparison

Backtests must compare:

| Strategy | Role |
|---|---|
| `MP_CORE_SIGNAL` | Existing quantitative baseline |
| `CANDLE_BREAKOUT_V1` | Candle breakout trend-following variant |
| `CANDLE_PULLBACK_V1` | Candle pullback continuation variant |

Default comparison period:

```text
2020-01-02 ~ 2025-12-31
```

If data is missing, the report must state the usable date range.

## Shared Universe

Use only existing `market_daily_price` OHLCV data.

Filters:

- `asset_type = 'STOCK'`
- close price is present and positive
- average trade amount over the signal window is positive
- exclude rows with insufficient lookback history
- use KOSPI market regime when index data exists

No synthetic financial, short-selling, futures, or after-hours fields are allowed in this iteration.

Do not use:

- `quant_core_feature_snapshot`
- `quant_core_signal`
- MP_CORE score/rank/reason/risk flag fields
- fundamental/value/quality features
- investor-flow features

The only exception is benchmark reporting after the candle model backtest is already computed.

## Market Regime

Use KOSPI index as the first market filter:

```text
RISK_ON:
  KOSPI close > 120-day moving average
  and KOSPI close > 200-day moving average when 200MA is available

NEUTRAL:
  KOSPI close > 120-day moving average
  but 200MA confirmation is missing or weaker

RISK_OFF:
  KOSPI close <= 120-day moving average
```

V1 rule:

- `RISK_ON`: allow new entries.
- `NEUTRAL`: allow entries with score penalty.
- `RISK_OFF`: block new entries.

## Variant 1: CANDLE_BREAKOUT_V1

Purpose:

- Capture stocks that show strong trend continuation through prior highs.

Monthly pick rules:

- Signal date is the last available trading day before the rebalance date.
- Rebalance date is the first trading day of each month.
- Exit date is the last trading day of each month.
- Candidate must have at least 60 prior trading days.

Entry filters:

```text
close >= prior 60-day high * 0.995
close > 20-day moving average
close > 60-day moving average
20-day moving average >= 60-day moving average * 0.98
close >= open
close position inside daily candle >= 0.60
20-day average trade amount is positive
market regime is RISK_ON or NEUTRAL
```

Score:

```text
score =
  0.30 * breakout_rank
+ 0.20 * trend_rank
+ 0.20 * liquidity_rank
+ 0.15 * candle_strength_rank
+ 0.10 * volume_expansion_rank
+ 0.05 * stability_rank
- regime_penalty
```

Where:

- `breakout_rank`: close divided by prior 60-day high.
- `trend_rank`: 20-day return and 60-day return blend.
- `liquidity_rank`: 20-day average trade amount percentile.
- `candle_strength_rank`: close location inside daily range and positive body ratio.
- `volume_expansion_rank`: current volume divided by 20-day average volume.
- `stability_rank`: lower 20-day volatility ranks higher.
- `regime_penalty`: `0.05` in `NEUTRAL`, `0` in `RISK_ON`.

## Variant 2: CANDLE_PULLBACK_V1

Purpose:

- Buy a stock that already has an uptrend after a controlled pullback and rebound candle.

Monthly pick rules:

- Signal date is the last available trading day before the rebalance date.
- Rebalance date is the first trading day of each month.
- Exit date is the last trading day of each month.
- Candidate must have at least 60 prior trading days.

Entry filters:

```text
60-day return > 0
20-day moving average > 60-day moving average
close is between 20-day moving average * 0.97 and 20-day moving average * 1.05
recent 20-day drawdown is between -18% and -3%
close > previous close
close >= open
current low does not break far below 60-day moving average
20-day average trade amount is positive
market regime is RISK_ON or NEUTRAL
```

Score:

```text
score =
  0.25 * trend_rank
+ 0.20 * rebound_rank
+ 0.20 * pullback_quality_rank
+ 0.15 * liquidity_rank
+ 0.10 * candle_strength_rank
+ 0.10 * stability_rank
- regime_penalty
```

Where:

- `trend_rank`: 60-day return and moving-average spread blend.
- `rebound_rank`: close versus previous close and close location inside daily range.
- `pullback_quality_rank`: moderate drawdown ranks higher than shallow/no pullback or crash-like pullback.
- `liquidity_rank`: 20-day average trade amount percentile.
- `candle_strength_rank`: positive body and close near high.
- `stability_rank`: lower 20-day volatility ranks higher.
- `regime_penalty`: `0.05` in `NEUTRAL`, `0` in `RISK_ON`.

## Portfolio Rules

Initial V1 rules:

- top N: 10 for both strategies
- rebalance: monthly
- max single stock weight: reuse current dynamic cap in `simulateMonthlyPicks`
- sector cap: reuse current dynamic cap in `simulateMonthlyPicks`
- cash: any unallocated weight stays as cash
- costs: reuse existing commission and sell tax handling

V1 may reuse the existing `MonthlyPickVo` and `simulateMonthlyPicks` execution flow to reduce implementation risk, but it must not reuse MP_CORE feature generation, scoring, or candidate-selection rules.

## Backtest Rules

Required:

- Do not use same-day future information after the signal date.
- Generate picks from data available before the rebalance date.
- Buy at rebalance date `open_price` when present; otherwise `close_price`.
- Sell at exit date `open_price` when present; otherwise `close_price`.
- Include commission, sell tax, trade count, and turnover/cost reporting already supported by the strategy engine.

## Reporting

The first implementation can use existing strategy comparison endpoints and admin cache clearing.

Required comparison output:

- total return
- monthly compound return
- MDD
- Sharpe
- trade count
- win flag from existing summary
- normalized equity curve
- strategy name and `nameEn`

Optional later:

- average holding days
- breakout versus pullback signal count by month
- market regime attribution
- chart examples for representative trades

## Likely Files

Backend:

- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/runner/QuantStrategyInitRunner.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`
- `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/CandleBreakoutStrategy.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/CandlePullbackStrategy.java`

Docs/status:

- `.Codex/status/active-plan.md`
- `.Codex/status/back-report.md`
- `.Codex/status/verify-report.md`
- `.Codex/.logs/2026-05-24-log.md`

## Acceptance Criteria

| AC | Requirement |
|---|---|
| AC-1 | `CANDLE_BREAKOUT_V1` is registered as an active monthly stock strategy. |
| AC-2 | `CANDLE_PULLBACK_V1` is registered as an active monthly stock strategy. |
| AC-3 | Both strategy implementations are Spring components and resolve through `QuantStrategyService.getStrategyImpl`. |
| AC-4 | Both strategies return `MonthlyPickVo` rows from look-ahead-safe SQL using signal dates before rebalance dates. |
| AC-5 | Breakout candidate filters include prior high proximity, MA trend, bullish candle, liquidity, and market regime. |
| AC-6 | Pullback candidate filters include existing uptrend, controlled drawdown, rebound candle, liquidity, and market regime. |
| AC-7 | Backtests for both strategies can run through the existing `QuantBacktestService.backtest` path. |
| AC-8 | Existing `MP_CORE_SIGNAL` behavior remains unchanged. |
| AC-9 | `compareAll` can include MP_CORE, breakout, and pullback strategies in one response when their strategy IDs are selected, but MP_CORE is benchmark-only. |
| AC-10 | Backend compile passes. |
| AC-11 | No frontend build is required unless frontend files change. |
| AC-12 | If the 2020-2025 comparison fails to beat MP_CORE or has worse MDD, record next experiments instead of forcing parameters. |

## Follow-Up Experiment Grid

Only after V1 runs:

- top N: 5, 10, 15, 20
- breakout high window: 40, 60, 120 days
- pullback drawdown band: `-12%~-3%`, `-18%~-3%`, `-25%~-5%`
- rebalance: monthly first, weekly later
- market regime: strict RISK_ON only versus RISK_ON + NEUTRAL

## Required Technical Feature Snapshot

Before full-range comparison, create or materialize a chart-only feature snapshot from `market_daily_price`.

Required fields:

- `signal_date`
- `asset_code`, `asset_name`, `sector`
- `open_price`, `high_price`, `low_price`, `close_price`, `volume`, `market_cap`
- `ma20`, `ma60`
- `high20`, `high60_prior`
- `low20`
- `ret20`, `ret60`
- `drawdown20`, `drawdown60`
- `candle_location`
- `body_ratio`
- `volume_expansion`
- `range20`

This snapshot is a performance structure for pure OHLCV rules, not an MP_CORE feature table.

## Notes

- The book basis is conceptual, not copied rule text.
- V1 must remain transparent and reproducible from OHLCV data.
- If the strategy performs poorly, that is useful evidence. The next step should tune the experiment grid, not hide the result.
