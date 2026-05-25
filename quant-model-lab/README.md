# Quant Model Lab

Open this folder when working on quant models. It keeps the active code in its build-safe source locations and exposes short links here so the repo does not need to be restructured during model iteration.

## Start Here

1. Read `PLAN.md`.
2. Work mainly in `backend-quant/service/strategy/`, `backend-quant-mappers/MarketDailyPriceMapper.xml`, and `backend-quant-tests/service/strategy/`.
3. Use `codex-plans/2026-05-24_mp-trend-candle-implementation.md` for the latest candle model context.
4. Run focused tests from repo root:

```bash
cd market-pulse-api
bash ./mvnw -q -Dtest=CandleTrendStrategyTest test
```

## Current 3 Models

- `CANDLE_BREAKOUT_V1`: breakout after prior high with bullish close/trend filter.
- `CANDLE_PULLBACK_V1`: uptrend pullback and rebound candle.
- `CANDLE_MOMENTUM_H20_V1`: 20/60-day momentum near highs with volume confirmation.

## Useful Links

- `backend-quant/`: Spring quant domain package.
- `backend-quant-tests/`: quant backend tests.
- `backend-quant-mappers/`: MyBatis quant SQL.
- `frontend-quant-dashboard/`: MP_CORE dashboard UI.
- `frontend-quant-backtest/`: backtest UI.
- `reference-docs/`: quant reference notes.
