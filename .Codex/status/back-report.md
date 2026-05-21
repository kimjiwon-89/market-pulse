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
