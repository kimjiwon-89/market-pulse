# Market Supervisor

date: 2026-05-27
status: planned

## Role

Middle manager for all quant models.

Responsibilities:

- detect regime (현재 상태)
- predict direction (미래 방향) — Leading Model
- route to model
- cap risk by regime
- manage paper trading
- log every decision

## Two-Layer Signal Architecture

```text
Layer 1 — MarketRegimeModel  (후행, 현재 상태)
  BULL / SIDEWAYS / BEAR / CRASH
  → exit timing, 포지션 축소 기준

Layer 2 — LeadingModel  (선행, 향후 5~20일)
  BULL_LEAD / NEUTRAL / BEAR_LEAD
  → entry 필터 (BULL_LEAD일 때만 진입 허용)
```

## Model Routing

```text
BULL + BULL_LEAD  -> bull-v4   (진입 허용)
BULL + NEUTRAL    -> bull-v4   (진입 허용, 소규모)
BULL + BEAR_LEAD  -> 진입 차단
SIDEWAYS          -> sideways-v1
BEAR              -> bear-rebound-v1
CRASH             -> cash / no trade
```

## Leading Model 현황

B 모델 (OHLCV 프록시) 완료. 약한 예측력 확인.
실제 데이터 수집 중 — 2~3주 후 재검증 예정.

데이터 수집 스케줄:
```
16:05  공매도 (KRX) + ETF 거래량 → market_leading_snapshot
16:10  ETF 전종목 (KRX /eto/etf_bydd_trd) → market_daily_price
16:15  ETN 전종목 (KRX /etn/etn_bydd_trd) → market_daily_price
```

핵심 지표 (충분한 수집 후):
- `lvrg_invrs_ratio` = 레버리지ETF / 인버스ETF 거래량 (122630 / 114800)
- `short_sell_ratio` = 공매도 거래대금 비율

상세: `.Codex/plans/2026-05-27_leading-model-collection-pipeline.md`

## Contents

```text
research/
  Existing regime/supervisor research scripts, tests, and reports.
```
