# Market Supervisor Three-Model Architecture Plan

date: 2026-05-27
workspace root for implementation: `D:\market-pulse`
quant lab root: `D:\market-pulse\quant-model-lab`

## Goal

Rebuild quant runtime around a supervisor/router structure.

V4 is no longer the only model. V4 becomes one specialist:

```text
BULL -> BullV4Model
SIDEWAYS -> SidewaysModel
BEAR -> BearModel
CRASH/unclear -> no trade / cash
```

The system collects live paper data from each specialist model and later combines that data into a stronger meta model.

## Current Cleanup Decision

V4 research artifacts moved to:

```text
D:\market-pulse\quant-model-lab\.Codex\models\bull-v4
```

That folder contains:

- V4 paper integration plan
- W4/V3-FIN reports
- V4 research scripts
- final parameter snapshot

New architecture work should not keep adding V4 research files to the quant lab root.

## Core Idea

```text
MarketData
  -> MarketSupervisor
      -> MarketRegimeModel
      -> RegimeRouter
      -> model registry
          -> BullV4Model
          -> SidewaysModel
          -> BearModel
      -> PaperTradingManager
      -> DecisionLog
```

Each model does only what it is good at.

- `BullV4Model`: momentum/candle trend in confirmed bull market.
- `SidewaysModel`: range, pullback, mean-reversion, rotation.
- `BearModel`: defensive rebound or no-trade-first logic.
- `MarketSupervisor`: market state, routing, risk cap, paper execution, logging.

## Module Boundaries

### MarketSupervisor

Middle manager.

Responsibilities:

- Load latest index/market data.
- Compute regime label and confidence.
- Decide active model.
- Apply risk cap by regime.
- Call model generator.
- Pass signals to paper trading.
- Log every decision.

Output:

```text
decision_time
regime
confidence
selected_model
action
max_positions
position_cash
reason_json
```

### MarketRegimeModel

Inputs:

- KOSPI daily/intraday state
- KOSDAQ daily/intraday state
- MA20/MA60
- breadth if available
- volatility / drawdown if available

Outputs:

```text
regime: BULL | SIDEWAYS | BEAR | CRASH
confidence: 0.0~1.0
flags: json
```

Initial rules:

```text
BULL:
  KOSPI > MA20 and KOSDAQ > MA20

CRASH:
  KOSPI < MA60 and KOSDAQ < MA60 and drawdown/volatility bad

BEAR:
  one or both index below MA60, but not full crash

SIDEWAYS:
  not BULL and not BEAR/CRASH
```

### RegimeRouter

Routing table:

```text
BULL:
  model: BULL_V4
  max_positions: 10
  position_cash: configurable paper cash

SIDEWAYS:
  model: SIDEWAYS_V1
  max_positions: 3~5
  position_cash: smaller than bull

BEAR:
  model: BEAR_REBOUND_V1
  max_positions: 1~2
  position_cash: smallest

CRASH:
  model: NONE
  max_positions: 0
  action: NO_TRADE
```

Confidence rule:

```text
confidence < threshold -> NO_TRADE or reduce size
```

### Strategy Model Contract

All models must expose the same output shape.

```text
model_code
regime
signal_time
signal_date
asset_code
asset_name
entry_score
risk_score
confidence
expected_holding_days
position_size
entry_rule
exit_rule
reason_json
```

This lets the supervisor compare and later train a meta model.

## Production Data Tables

Add or reuse under backend `quant` domain.

```text
quant_market_regime_snapshot
quant_supervisor_decision_log
quant_model_signal
quant_paper_order
quant_paper_position
quant_model_daily_performance
```

If possible, reuse `quant_core_signal` for model signals at first. Add `reason_json`/`risk_flags` contents rather than creating duplicate signal tables unless schema becomes limiting.

## Implementation Phases

### Phase 1. Supervisor Shell

Build the routing shell first.

Deliverables:

- `MarketSupervisorService`
- `MarketRegimeService`
- `RegimeRouter`
- decision log table
- manual run API
- scheduler disabled by default

No Sideways/Bear strategy yet.

Acceptance:

- BULL routes to `BULL_V4`.
- non-BULL returns `NO_TRADE`.
- every run writes decision log.

### Phase 2. Bull Paper Runtime

Connect archived V4 plan.

Deliverables:

- `BULL_V4` registered model
- paper-only signal generation
- virtual orders/positions
- no live order path

Acceptance:

- V4 signals created only when supervisor says `BULL`.
- paper orders created without KIS order API.
- duplicate run does not create duplicate paper entries.

### Phase 3. Sideways Model

Build first non-bull specialist.

Idea:

- range-bound candidates
- lower range20/volatility expansion
- pullback near MA20/MA60 support
- shorter holding period
- smaller position cap

Initial target:

```text
SIDEWAYS_V1 = data collection model, not profit-optimized model
```

Acceptance:

- works only when supervisor says `SIDEWAYS`
- outputs same signal contract
- paper-only

### Phase 4. Bear Model

Build defensive model.

Idea:

- default no-trade
- only very selective rebound candidates
- short hold
- strict stop
- tiny position cap

Acceptance:

- works only when supervisor says `BEAR`
- no trades during `CRASH`
- paper-only

### Phase 5. Meta Dataset

Once all three models generate paper logs:

- compare model/regime performance
- train router weights or rules
- identify false regime classifications
- decide if one combined model is worth building

## Backend Work Areas

Use `D:\market-pulse`.

Likely files/packages:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/supervisor/
market-pulse-api/src/main/java/com/marketpulse/domain/quant/paper/
market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/
market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/v4_bull/
market-pulse-api/src/main/resources/mapper/quant/
```

Existing anchors:

```text
QuantController
QuantModelDefinitionService
QuantModelSignalService
QuantSchemaInitRunner
MarketDailyPriceMapper
QuantCoreSignalMapper
```

## API Draft

```text
POST /api/quant/supervisor/run?date=YYYY-MM-DD
GET  /api/quant/supervisor/status
GET  /api/quant/supervisor/decisions?from=&to=&limit=
GET  /api/quant/paper/orders?modelCode=&from=&to=
GET  /api/quant/paper/positions?modelCode=
GET  /api/quant/paper/performance?modelCode=&from=&to=
POST /api/quant/paper/reset?modelCode=
```

Run/reset admin-only.

## Scheduler Draft

Default disabled.

```yaml
quant:
  supervisor:
    enabled: false
    paper-only: true
    interval-minutes: 10
    min-confidence: 0.60
```

Runtime rule:

- no parallel runs
- scheduler lock required
- if previous run still active, skip
- no live order code path

## Guardrails

- No real order execution.
- Paper-only until at least 1~2 months live data collected.
- No single model handles all regimes.
- CRASH always overrides model signals.
- Low confidence reduces position or blocks trading.
- Every decision must have reason JSON.
- Backtest improvements are secondary now; live paper data is primary.

## Claude Implementation Prompt

Use this prompt when handing off:

```text
Work in D:\market-pulse on branch feature/market-supervisor-paper-runtime from develop.

Implement Phase 1 only:
- MarketSupervisorService
- MarketRegimeService
- RegimeRouter
- decision log schema/mappers
- manual supervisor run API
- scheduler config disabled by default

Do not implement live orders.
Do not implement Sideways/Bear strategies yet.
Do not move V4 archive files.

Use existing quant patterns:
- QuantController
- QuantSchemaInitRunner
- MyBatis mapper XML under resources/mapper/quant
- ApiResponse.success/failure

Write result to:
D:\market-pulse\quant-model-lab\.Codex\status\back-report.md
```

## Next Step

Do Phase 1 first.

After Phase 1 passes, connect `BULL_V4` paper runtime from the archived V4 plan.
