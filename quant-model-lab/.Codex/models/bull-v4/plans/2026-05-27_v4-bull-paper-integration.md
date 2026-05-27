# V4 Bull Paper Trading Integration Plan

date: 2026-05-27
root for implementation: `D:\market-pulse`
target branch base: `develop`
recommended branch: `feature/v4-bull-paper-trader`

## Goal

Market Pulse 본 프로젝트 아래에 V4 완성본을 `BULL` 전용 모델로 붙인다.

첫 배포 목표는 실거래가 아니다.

- 실시간 감시
- 신호 생성
- 모의 매매
- 운영 로그 축적
- 장세별 라우팅 기반 마련

실제 주문 API 호출은 이번 범위에서 금지한다.

## Current Decision

V4는 `BullV4Model`로 등록한다.

초기 운영 파라미터는 백테스트 마지막 개선 결과 중 균형형을 사용한다.

```text
model_code: BULL_V4
implementation_key: bull_v4
allowed_regime: BULL
entry_delay_days: 5
entry_loc_min: 0.55
entry_ma20_dist_min: 0.02
entry_next_body_min: 0.005
range20_max: 0.40
top_n: 50
ret60_max: null
max_positions: 10 paper positions
position_cash: 10,000,000~20,000,000 KRW paper start
execution_mode: PAPER_ONLY
```

품질형 shadow config도 같이 남긴다.

```text
shadow_quality_config:
  entry_next_body_min: 0.01
  range20_max: 0.40
  ret60_max: 0.80
```

운영은 균형형으로 하고, 품질형은 같은 날짜 신호를 별도 로그로 비교한다.

## Architecture

```text
market data
  -> candle feature snapshot
  -> MarketSupervisor
      -> MarketRegimeService
      -> RegimeRouter
      -> BullV4SignalGenerator
      -> PaperTradingService
  -> quant_core_signal
  -> quant_paper_order / quant_paper_position
  -> dashboard/API
```

## Existing Project Anchors

Use these existing files and patterns.

```text
D:\market-pulse\market-pulse-api\src\main\java\com\marketpulse\domain\quant
D:\market-pulse\market-pulse-api\src\main\resources\mapper\quant
```

Existing reusable parts:

- `QuantModelDefinition`
- `QuantFeatureGenerator`
- `QuantModelDefinitionService.seedCodeModels()`
- `QuantModelSignalService`
- `quant_model_definition`
- `quant_core_feature_snapshot`
- `quant_candle_feature_snapshot`
- `quant_core_signal`
- `MarketDailyPriceMapper.generateCandleTrendFeatures`

## Backend Implementation

### 1. Register BULL_V4 Model

Add:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/v4_bull/BullV4ModelDefinition.java
```

Implement `QuantModelDefinition`.

Return:

```text
modelCode: BULL_V4
displayName: Bull V4 Paper Model
modelType: SIGNAL
implementationKey: bull_v4
```

Default config must include all frozen parameters above.

`QuantModelInitRunner` already seeds all `QuantModelDefinition` beans, so no manual seed SQL needed unless tests need fixtures.

### 2. Add Signal Generator Dispatch

Current `QuantModelSignalService.generate()` always calls `QuantCoreSignalMapper.generateBaselineSignals(...)`.

Change this to registry dispatch.

Add interface:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/QuantSignalGenerator.java
```

Contract:

```java
String implementationKey();
int generateSignals(String modelCode, LocalDate signalDate, int limit);
```

Add:

```text
QuantCoreBaselineSignalGenerator
BullV4SignalGenerator
```

`QuantModelSignalService` should:

1. Load model by `modelCode`.
2. Find `QuantSignalGenerator` by `implementationKey`.
3. Reject unknown implementation key.
4. Call generator.

Keep MP_CORE behavior unchanged by wrapping old baseline mapper call in `QuantCoreBaselineSignalGenerator`.

### 3. Generate BULL_V4 Signals

Add mapper:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantBullV4SignalMapper.java
market-pulse-api/src/main/resources/mapper/quant/QuantBullV4SignalMapper.xml
```

Use `quant_candle_feature_snapshot`.

Signal filters:

```text
asset_type = STOCK
ret60 positive enough for W4 candidate
range20 <= 0.40
candle_location >= 0.55
close_price > ma20 * 1.02
entry_next_body_min cannot be fully known on signal date if using same-day live signal
```

Important split:

- Historical/paper daily mode can apply next-day body confirmation after it exists.
- Real-time same-day watch mode cannot use future next-day body.

Therefore implement two states:

```text
CANDIDATE: signal-day W4 candidate found
CONFIRMED: entry-check day and next body confirmation passed
```

Store both in `reason` JSON:

```json
{
  "engine": "bull_v4",
  "state": "CANDIDATE|CONFIRMED",
  "range20": 0.36,
  "ret60": 0.52,
  "entryNextBodyMin": 0.005,
  "paperOnly": true
}
```

For initial MVP, generate `CONFIRMED` paper signals only when required future candle data already exists.

For real-time monitor, generate `CANDIDATE` and let scheduler re-check confirmation later.

### 4. Market Supervisor

Add package:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/supervisor
```

Classes:

```text
MarketSupervisorService
MarketRegimeService
RegimeRouter
SupervisorDecision
```

Responsibilities:

- Read KOSPI/KOSDAQ index rows from `market_daily_price`.
- Calculate `BULL / SIDEWAYS / BEAR / CRASH`.
- Calculate confidence.
- Route only `BULL` to `BULL_V4`.
- Return `NO_TRADE` for SIDEWAYS/BEAR/CRASH until those models exist.
- Write every decision to DB/log.

Initial regime rules:

```text
BULL:
  KOSPI close > MA20
  KOSDAQ close > MA20
  confidence >= 0.65

CRASH:
  KOSPI close < MA60
  KOSDAQ close < MA60
  confidence >= 0.70

BEAR:
  one or both indices below MA60

SIDEWAYS:
  not BULL and not BEAR/CRASH
```

### 5. Paper Trading

Add:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/paper
```

Classes:

```text
PaperTradingService
PaperPortfolioService
PaperOrderMapper
PaperPositionMapper
```

Tables in `QuantSchemaInitRunner`:

```sql
quant_market_regime_snapshot
quant_supervisor_decision_log
quant_paper_order
quant_paper_position
```

Minimum columns:

```text
quant_market_regime_snapshot:
  snapshot_date, snapshot_time, regime, confidence, kospi_state, kosdaq_state, reason_json

quant_supervisor_decision_log:
  decision_time, regime, confidence, routed_model_code, action, reason_json

quant_paper_order:
  id, model_code, signal_date, order_time, asset_code, asset_name,
  side, paper_price, quantity, amount, status, reason_json

quant_paper_position:
  id, model_code, asset_code, asset_name, entry_time, entry_price,
  quantity, amount, current_price, unrealized_return, status, exit_time, exit_price, reason_json
```

No KIS order endpoint may be called from paper code.

### 6. Scheduler

Add scheduler:

```text
BullV4PaperScheduler
```

Recommended v1 cadence:

```text
09:10~15:20 KST, every 10 minutes:
  - compute latest regime
  - if BULL: refresh candidates/signals
  - create paper orders for new confirmed signals
  - update open paper positions with latest price
  - evaluate paper exits

15:35 KST:
  - end-of-day summary snapshot
```

AWS free-tier rule:

- no parallel scan
- cap candidate universe by liquidity/top rank
- batch DB queries
- one scheduler lock so duplicate runs do not overlap

### 7. API

Add endpoints under existing `QuantController` or a new `QuantSupervisorController`.

```text
POST /api/quant/supervisor/run?date=YYYY-MM-DD
GET  /api/quant/supervisor/status
GET  /api/quant/supervisor/decisions?from=&to=&limit=
GET  /api/quant/paper/orders?modelCode=BULL_V4&from=&to=
GET  /api/quant/paper/positions?modelCode=BULL_V4
POST /api/quant/paper/reset?modelCode=BULL_V4
```

Admin-only for run/reset.

Read-only endpoints can follow current auth policy.

## Frontend Scope

Minimal first view only.

Add to quant dashboard later:

```text
Market Supervisor status
BULL_V4 paper positions
latest paper orders
latest routed regime
paper PnL summary
```

Frontend is optional for first backend MVP.

## Data Flow

Daily/paper confirmed flow:

```text
market_daily_price updated
-> generateCandleTrendFeatures(from, to)
-> MarketRegimeService snapshot
-> MarketSupervisor decides BULL or NO_TRADE
-> BullV4SignalGenerator writes quant_core_signal
-> PaperTradingService creates virtual entry
-> PaperTradingService tracks exit
```

Real-time monitor flow:

```text
latest quote/minute data
-> supervisor snapshot
-> BULL_V4 candidate watchlist
-> paper fill using observed quote
-> log fill/slippage/position path
```

## Exit Rules For Paper V1

Use current V4 paper exit policy from research:

```text
hard_stop: -12%
early_fail_close: -6% within first 3 trading days
conditional extension: hold up to 60d if +25% and MA20 condition ok
default max hold: current V4 configured hold window
```

For real-time MVP, exit can be evaluated from latest close first. Intraday stop can be added only after orderbook/minute reliability is checked.

## Acceptance Criteria

- `BULL_V4` appears in `/api/quant/models`.
- `POST /api/quant/model/BULL_V4/features` or equivalent existing feature generation path works.
- `POST /api/quant/models/BULL_V4/signals` or existing generate endpoint writes signals only through `bull_v4` generator.
- MP_CORE signal generation still works unchanged.
- Supervisor returns `NO_TRADE` outside BULL.
- Paper order table receives virtual orders only; no live order API is called.
- Duplicate scheduler runs do not duplicate paper orders.
- Every supervisor decision writes reason JSON.
- Backfill mode can run on a historical date for debugging.
- Unit/integration tests cover BULL route, NO_TRADE route, and signal generator dispatch.

## Test Plan

Backend tests:

```text
QuantModelDefinitionService seed includes BULL_V4.
QuantModelSignalService dispatches by implementation_key.
BullV4SignalGenerator writes ranked quant_core_signal rows.
MarketRegimeService classifies BULL/SIDEWAYS/BEAR/CRASH from fixture index rows.
MarketSupervisorService routes BULL to BULL_V4 and non-BULL to NO_TRADE.
PaperTradingService creates no duplicate order for same model/date/asset.
```

Manual checks:

```bash
cd D:\market-pulse\market-pulse-api
.\mvnw test
.\mvnw spring-boot:run
```

Swagger/manual:

```text
GET /api/quant/models
POST /api/quant/supervisor/run?date=2026-05-27
GET /api/quant/supervisor/status
GET /api/quant/paper/positions?modelCode=BULL_V4
```

## Implementation Order For Claude

1. Create branch from `develop`: `feature/v4-bull-paper-trader`.
2. Add `QuantSignalGenerator` dispatch without changing MP_CORE output.
3. Add `BullV4ModelDefinition`.
4. Add BULL_V4 signal SQL using `quant_candle_feature_snapshot`.
5. Add supervisor regime snapshot service.
6. Add paper trading tables/mappers/service.
7. Add scheduler disabled by default via config.
8. Add API endpoints.
9. Add tests.
10. Run backend tests and write result to `D:\market-pulse\quant-model-lab\.Codex\status\back-report.md`.

## Config Flags

Add to application config:

```yaml
quant:
  supervisor:
    enabled: false
    paper-only: true
    min-bull-confidence: 0.65
  bull-v4:
    enabled: true
    model-code: BULL_V4
    top-n: 50
    position-cash: 10000000
    max-positions: 10
```

Schedulers must stay off by default until manually enabled.

## Out Of Scope

- Live order placement
- Sideways model
- Bear model
- Full frontend dashboard
- ML learned router
- New paid infrastructure

## Main Risk

V4 uses delayed confirmation in research. Real-time same-day operation cannot know next-day candle. MVP must separate `CANDIDATE` and `CONFIRMED`; only confirmed signals enter paper orders until a true intraday entry rule is validated.

## Final Recommendation

Implement `BULL_V4` as paper-only model now.

Do not keep optimizing backtest before deployment.

Collect live paper data first, then use that data to design Sideways/Bear models and later train a learned `MarketSupervisor`.
