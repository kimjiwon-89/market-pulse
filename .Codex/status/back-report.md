## Backend Rework Report

spec: `.Codex/plans/2026-05-21_quant-mp-core-frontend-spec.md`
completed: 2026-05-21

### Changed Files
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantCandidateSignalDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantBacktestEvidenceDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantMonthlyReturnDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantCostSummaryDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/QuantPortfolioTargetDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/BacktestRequestDto.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantBacktestService.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java`
- `market-pulse-api/src/main/resources/mapper/quant/QuantCoreDashboardMapper.xml`

### Implemented
- Added `rebalanceStatus` to candidate row/detail responses, separate from `signalState`.
- Added top-level backtest fields: `monthlyReturn`, `mdd`, `sharpe`, `winRate`, `totalCost`.
- Aligned monthly returns to `{ year, month, returnPct }`.
- Expanded cost summary with `grossReturn`, `netReturn`, `totalTurnover`, `avgTurnover`, `totalFee`, `totalTax`, `totalCost`, and `tradeCount`.
- Kept portfolio `positions` and added `holdings` alias for compatibility.
- Added default strategy handling for backtest requests.

### Verification
- `market-pulse-api`: `.\mvnw.cmd -DskipTests compile` passed after approved Maven network access.

### Notes
- No DB DDL changes required.
- Runtime data completeness still depends on existing quant table contents.

## Backend MP_CORE Backtest Repair

spec: `.Codex/plans/2026-05-21_quant-mp-core-monthly-5pct-spec.md`
completed: 2026-05-21

### Changed Files
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantCoreDashboardMapper.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantStrategyMapper.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/mp_core/MpCoreModelDefinition.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/runner/QuantStrategyInitRunner.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantBacktestService.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantStrategyService.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/MpCoreSignalStrategy.java`
- `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`
- `market-pulse-api/src/main/resources/mapper/quant/QuantCoreDashboardMapper.xml`
- `market-pulse-api/src/main/resources/mapper/quant/QuantStrategyMapper.xml`

### Implemented
- Added `MP_CORE_SIGNAL` strategy so core backtests no longer use `strategyId: 1`.
- Added monthly MP_CORE feature-score pick query from `quant_core_feature_snapshot`.
- Changed `/api/quant/core/backtests` to run the MP_CORE strategy directly.
- Changed latest core backtest reads to filter only `MP_CORE_SIGNAL` results.
- Changed core dashboard monthly return calculation to compound monthly conversion.
- Changed MP_CORE staged target monthly return from 15% to 5%.

### Verification
- `market-pulse-api`: `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile` passed.
