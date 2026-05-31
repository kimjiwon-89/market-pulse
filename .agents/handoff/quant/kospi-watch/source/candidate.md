# kospi-watch-v0.1.0 Candidate Package

## Identity

- Family: `KOSPI_WATCH`
- Model code: `kospi-watch`
- Model version: `0.1.0`
- Runtime config key: `kospi-watch-v0.1.0`
- Owner: `market-pulse-lab`
- Lab status: `VALIDATING`
- Market scope: `KOSPI`
- Package path: `domains/quant/model-candidates/KOSPI_WATCH/kospi-watch-v0.1.0`
- Created date: `2026-05-30`

## Purpose

`kospi-watch-v0.1.0` is a paper-shadow handoff package for the KOSPI side of the realtime market regime monitor.

It does not select stocks, size positions, expose public model results, or place orders. Its only production-facing role is to classify the KOSPI regime state and provide a gating signal to strategy routing.

## Source Implementation

- Source model: `domains/quant/legacy-quant-model-lab/.Codex/models/market-supervisor`
- Classifier: `research/scripts/market_regime_model.py`
- Realtime runner: `research/scripts/compute_realtime_regime.py`
- Source report: `research/reports/2026-05-27_market-regime-model.md`
- Unit tests:
  - `research/tests/test_market_regime_model.py`
  - `research/tests/test_realtime_regime_cache.py`

## Runtime Contract

- Runtime expectation: `JAVA_OR_SCRIPTED_RUNTIME`
- Implementation key: `kospi-watch-v0.1.0`
- Expected runtime class: production may implement as `KospiWatchRuntime` or as a parameterized market-supervisor runtime keyed by `runtimeConfigKey`.
- Public exposure default: `false`
- Admin exposure default: `paper_shadow_only`
- Live order permission: `false`
- Cache requirement: use cached slow features and live KOSPI index price; do not recalculate broad market features inside user-facing requests.

## Input Features

KOSPI watch depends on KOSPI index levels plus shared market breadth/liquidity features:

```text
kospi_close
kospi_ma20
kospi_ma60
kospi_ma20_slope_5d
kospi_vol20
breadth_ma20
breadth_ma60
liquidity_trend
```

The current prototype also requires KOSDAQ index features because the underlying supervisor computes combined routing state in the same pass. Production may store KOSPI and KOSDAQ watch rows separately after computing one shared snapshot.

## Classification Rules

Single-index classification:

```text
CRASH if breadth_proxy <= 0.20 and vol20 >= 0.040 and index_close <= MA60
BULL if single-index bull score >= 5
BEAR if single-index bear score >= 4
otherwise SIDEWAYS
```

KOSPI bull score components:

```text
close > MA20
close > MA60
MA20 slope over 5 days > 0
breadth_ma20 >= 0.55
kospi_vol20 <= 0.025
liquidity_trend >= 0
```

KOSPI bear score components:

```text
close <= MA60
MA20 slope over 5 days < 0
breadth_ma20 <= 0.35
kospi_vol20 >= 0.030
liquidity_trend < 0
```

## Output

```text
trade_date
market_scope = KOSPI
regime = BULL | SIDEWAYS | BEAR | CRASH
risk_budget = 1.0 | 0.5 | 0.2 | 0.0
allowed_strategy = W4_BREAKOUT | W4_RESTRICT | W4_RECOVER | CASH
confidence
bull_score
bear_score
stress_score
```

## Validation Result

Historical combined supervisor snapshot:

| Period | Dates | BULL | SIDEWAYS | BEAR | CRASH |
|---|---:|---:|---:|---:|---:|
| 2012-03-28 to 2026-05-26 | 3,477 | 38.1% | 38.0% | 23.7% | 0.2% |

Prototype test coverage:

- Rule classifier covers BULL, SIDEWAYS, BEAR, and CRASH cases.
- Realtime helper covers cached slow-feature use with live index prices.
- Realtime result includes `kospi_regime`, `kosdaq_regime`, and `combined_raw`.

## Runtime Approval Gate

Production can attach this package as a paper-shadow monitor only after:

- KIS or production quote provider confirms KOSPI live index code and timestamp semantics.
- Cached MA20/MA60/slope/volatility features are generated from production market data.
- Snapshot storage is reviewed and separated from public model exposure.
- Disconnect fallback uses the last valid snapshot and marks data freshness.
- Strategy routers consume this monitor as a gate, not as an order generator.

## Known Gaps

- No independent KOSPI-only production runtime exists yet.
- Current lab implementation computes KOSPI and KOSDAQ watch values together.
- Intraday persistence and disconnect fallback need production implementation review.
- This package is not approval for public display or live trading.
