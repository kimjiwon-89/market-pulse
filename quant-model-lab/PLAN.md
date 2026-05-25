# Quant Model Lab Plan

Goal: test and tune the three candle quant models until the target return reaches 15% without adding look-ahead bias.

## Constraints

- Keep signal date, rebalance date, execution date, and return window separate.
- Include costs, turnover, MDD, win rate, monthly return, and risk-adjusted metrics.
- Change one model variable at a time and record the result before the next run.
- Do not move Java source files out of `market-pulse-api/src/main/java`; this folder links to them.

## Iteration Loop

1. Baseline
   - Run current three model tests.
   - Capture total return, monthly return, MDD, win rate, trade count, and turnover.
2. Tune candidates
   - `CANDLE_BREAKOUT_V1`: breakout window, volume percentile, close-strength threshold, max volatility cap.
   - `CANDLE_PULLBACK_V1`: drawdown band, rebound candle definition, trend MA window, stop filter.
   - `CANDLE_MOMENTUM_H20_V1`: 20/60 momentum weights, high-distance cap, liquidity floor, volatility penalty.
3. Compare
   - Keep top 3 parameter sets per model.
   - Prefer stable monthly returns over one-off spikes.
4. Promote
   - Register best candidate as the active V1 or create a V2 only when behavior materially changes.
   - Update tests and `codex-reports/` with the final comparison.

## Next Files

- Strategy code: `backend-quant/service/strategy/`
- Candle SQL: `backend-quant-mappers/MarketDailyPriceMapper.xml`
- Mapper API: `backend-quant/mapper/MarketDailyPriceMapper.java`
- Tests: `backend-quant-tests/service/strategy/CandleTrendStrategyTest.java`
