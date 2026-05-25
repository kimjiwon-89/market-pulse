# MTF Candle Trend Spec

date: 2026-05-24
status: PLANNED_NEEDS_USER_APPROVAL
branch: feature/quant-candle-models-15pct

## Goal

Build a multi-timeframe trend-following model that does not force monthly rebalancing.
The model should use monthly, weekly, daily, and minute-bar context to decide entry and exit.

Working name:

```text
CANDLE_MTF_TREND_V2
```

## Problem

The current candle strategies still behave like scheduled portfolio rotations.
They pick names around monthly rebalance dates, then hold until an exit date.
That is weak for trend following because the calendar can force trades when the chart has not changed.

The new model should trade when the trend state changes:

```text
monthly: big regime
weekly: candidate trend
daily: entry and exit signal
minute: execution quality gate
```

## Data Reality

Daily OHLCV exists in `market_daily_price`.

Minute bars are only partially available in the current project:

- `GET /api/stock/minute-chart` uses KIS same-day minute API.
- KIS same-day minute API is not full historical minute backfill.
- Historical minute backtests require stored `stock_minute_bar` rows or a paid/vendor backfill source.

Therefore V2 must be honest:

- Use historical daily data for full-range backtests.
- Use minute bars only when stored bars exist for the signal/execution date.
- If minute bars are absent, record a fallback execution assumption instead of pretending minute data existed.

## Strategy Shape

### Monthly Layer

Purpose: broad risk mode.

Inputs:

- KOSPI/KOSDAQ monthly trend if index rows exist.
- Price above long moving average.
- Long-term return and drawdown.

Outputs:

- `RISK_ON`
- `RISK_NEUTRAL`
- `RISK_OFF`

Rules:

- `RISK_OFF` blocks new buys or raises cash floor.
- `RISK_NEUTRAL` allows only high-quality setups.
- `RISK_ON` allows normal exposure.

### Weekly Layer

Purpose: candidate selection.

Inputs:

- 4-week and 12-week return.
- 52-week high distance.
- weekly volatility/range.
- weekly volume expansion.
- weekly candle class.

Outputs:

- candidate score.
- trend state.

Candidate states:

- `UPTREND`
- `BASE`
- `BREAKOUT_READY`
- `EXTENDED`
- `DISTRIBUTION`
- `DOWNTREND`

### Daily Layer

Purpose: actual entry and exit trigger.

Entry candle classes:

- `BREAKOUT`
- `PULLBACK_REBOUND`
- `TREND_CONTINUATION`
- `VOLATILITY_COMPRESSION_RELEASE`

Exit candle classes:

- `FAILED_BREAKOUT`
- `DISTRIBUTION`
- `MA_BREAKDOWN`
- `TRAILING_STOP`
- `RISK_OFF_EXIT`

Daily rules:

- signal date must be before execution date.
- same close cannot be both signal and fill.
- default historical fill is next trading day close unless minute bars exist.

### Minute Layer

Purpose: execution gate, not long-term alpha source at first.

Minute inputs when available:

- VWAP relation.
- first 30-minute range.
- intraday high/low break.
- volume spike.
- gap-up fade.
- late-day recovery.

Minute states:

- `CONFIRMED_ENTRY`
- `CHASE_RISK`
- `VWAP_FAIL`
- `LATE_BREAKOUT`
- `NO_MINUTE_DATA`

Rules:

- Entry can be blocked by `CHASE_RISK` or `VWAP_FAIL`.
- Entry can be allowed by `CONFIRMED_ENTRY` or `LATE_BREAKOUT`.
- `NO_MINUTE_DATA` must be logged as fallback, not hidden.

## Rebalance Model

Rename the mental model from rebalance to event-driven trade generation.

Old:

```text
monthly date -> choose top N -> hold until next date
```

New:

```text
daily signal scan -> entry event -> position state -> exit event
```

Monthly review can remain as reporting, but it must not force turnover.

## Engine Changes

Add a new backtest path instead of stretching `simulateMonthlyPicks`.

Suggested new value object:

```text
TrendTradeSignalVo
- signalDate
- executionDate
- exitSignalDate
- exitExecutionDate
- assetCode
- assetName
- assetType
- sector
- entryPrice
- exitPrice
- score
- marketRegime
- weeklyState
- dailyCandleClass
- minuteState
- executionAssumption
- reason
```

Suggested engine:

```text
simulateEventDrivenSignals(...)
```

Responsibilities:

- hold positions across arbitrary dates.
- skip duplicate entry while already holding same asset.
- apply position cap and cash floor.
- apply stop/trailing stop.
- calculate cost, tax, turnover, MDD, win rate, monthly compound, Sharpe.
- log missing minute data assumptions.

## Implementation Phases

### Phase 1: Plan And Contract

- Write user HTML plan.
- Write this agent spec.
- Wait for user approval.

### Phase 2: Daily/Weekly/Monthly Event Engine

- Add tests for event-driven signal simulation.
- Add `CANDLE_MTF_TREND_V2` strategy shell.
- Add mapper contract for MTF candidate signals.
- Build monthly, weekly, daily features from existing daily OHLCV.
- Keep minute state as `NO_MINUTE_DATA` when no table exists.

### Phase 3: Minute Storage And Gate

- Add `stock_minute_bar` schema if not already implemented.
- Add mapper/service for stored minute bars.
- Connect minute gate to signal execution when bars exist.
- Do not use live-only same-day minute API for historical backtest claims.

### Phase 4: Verification

- Focused unit tests for candle classification.
- Focused unit tests for event-driven position state.
- MyBatis XML validation.
- Backend compile.
- Backtest comparison report:
  - MP_CORE_SIGNAL
  - CANDLE_MOMENTUM_H20_V1
  - CANDLE_MTF_TREND_V2 daily-only fallback
  - CANDLE_MTF_TREND_V2 with minute gate where data exists

## Acceptance Criteria

- AC-1: Strategy `CANDLE_MTF_TREND_V2` is registered but not confused with old monthly candle strategies.
- AC-2: Backtest separates `signalDate`, `executionDate`, `exitSignalDate`, and `exitExecutionDate`.
- AC-3: Monthly/weekly/daily features use only data available before execution.
- AC-4: Minute gate is used only when historical minute bars exist for that asset/date.
- AC-5: Missing minute data is visible in diagnostics or trade reason as `NO_MINUTE_DATA`.
- AC-6: Monthly calendar dates do not force full portfolio turnover.
- AC-7: Costs, turnover, MDD, win rate, monthly compound, and Sharpe remain reported.
- AC-8: Existing `MP_CORE_SIGNAL`, `CANDLE_BREAKOUT_V1`, `CANDLE_PULLBACK_V1`, and `CANDLE_MOMENTUM_H20_V1` still compile and run.
- AC-9: Tests and backend compile pass.

## Open Decision

Minute bars are the only hard tradeoff.

Recommended default:

```text
Build V2 with daily/weekly/monthly historical backtest first.
Add minute gate as available-data execution filter.
Start storing minute bars now for future true intraday backtests.
```

