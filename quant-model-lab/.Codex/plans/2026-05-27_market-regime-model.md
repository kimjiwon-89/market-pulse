# Market Regime Model Plan

date: 2026-05-27
status: PLANNING_ONLY
workspace: `D:\market-pulse\quant-model-lab`

## Goal

Create a market regime model that detects current market condition in realtime and passes that condition into the quant stock-selection model.

The quant model should no longer select stocks in isolation. It should receive:

```text
market regime -> risk budget -> allowed strategy -> stock selection rules
```

## Core Idea

Build `MARKET_REGIME_MODEL` first as a rule-based backtestable engine.

Later, backend realtime flow should calculate the same features every market day or intraday refresh, store a regime snapshot, and let quant strategies read the latest valid snapshot.

## Regime Types

### BULL

Meaning:
- Market trend is favorable.
- Breakout and momentum strategies allowed.

Expected strategy behavior:
- Allow W4/V3-FIN breakout.
- Higher risk budget.
- Longer hold and trend-following exit allowed.

### SIDEWAYS

Meaning:
- Market is mixed or range-bound.
- Breakout works only selectively.

Expected strategy behavior:
- Allow W4/V3-FIN only with stricter entry.
- Lower top fallback.
- Shorter hold or tighter trailing.
- Avoid weak market breadth days.

### BEAR

Meaning:
- Market trend is negative.
- Normal breakout is unreliable.

Expected strategy behavior:
- Block or heavily reduce W4 breakout.
- Prefer future `W4_RECOVER`.
- Risk budget low.

### CRASH

Meaning:
- Market is in high-volatility breakdown.

Expected strategy behavior:
- Cash only.
- No new stock picks.

## Input Features

Use only data available on or before `trade_date`.

### Index Trend

For KOSPI and KOSDAQ:

```text
close > ma20
close > ma60
ma20_slope_5d
ma60_slope_5d
ret20
ret60
```

### Market Breadth

Across stock universe:

```text
breadth_ma20 = count(stock close > stock ma20) / count(valid stocks)
breadth_ma60 = count(stock close > stock ma60) / count(valid stocks)
advance_ratio_5d = count(stock ret5 > 0) / count(valid stocks)
```

### Volatility / Stress

For KOSPI and KOSDAQ:

```text
volatility_20 = stddev(index daily return, 20d)
range20 = (20d high - 20d low) / close
drawdown_20 = close / 20d high - 1
drawdown_60 = close / 60d high - 1
```

### Liquidity

Across stock universe:

```text
trade_amount_20 = rolling avg close * volume
liquidity_trend = current total trade amount / 20d avg total trade amount - 1
```

Optional later:
- foreign/institution flow
- exchange rate
- rates
- KOSPI200 volatility index

## Rule-Based Score Draft

### Bull Score

Add points:

```text
+1 KOSPI close > MA20
+1 KOSDAQ close > MA20
+1 KOSPI close > MA60
+1 KOSDAQ close > MA60
+1 KOSPI MA20 slope > 0
+1 KOSDAQ MA20 slope > 0
+1 breadth_ma20 >= 0.55
+1 volatility_20 <= normal threshold
+1 liquidity_trend >= 0
```

### Bear Score

Add points:

```text
+1 KOSPI close < MA60
+1 KOSDAQ close < MA60
+1 KOSPI MA20 slope < 0
+1 KOSDAQ MA20 slope < 0
+1 breadth_ma20 <= 0.35
+1 volatility_20 elevated
+1 liquidity_trend < 0
```

### Crash Override

Classify as `CRASH` if:

```text
breadth_ma20 <= 0.20
and volatility_20 very high
and KOSPI close < MA60
and KOSDAQ close < MA60
```

## Output Contract

Each snapshot should produce:

```text
trade_date
regime: BULL | SIDEWAYS | BEAR | CRASH
confidence: 0.0 ~ 1.0
risk_budget: 0.0 ~ 1.0
allowed_strategy: W4_BREAKOUT | W4_RECOVER | CASH
bull_score
bear_score
stress_score
breadth_ma20
breadth_ma60
volatility_20
liquidity_trend
```

Suggested mapping:

```text
BULL     -> risk_budget 1.00, allowed_strategy W4_BREAKOUT
SIDEWAYS -> risk_budget 0.50, allowed_strategy W4_BREAKOUT with stricter rules
BEAR     -> risk_budget 0.20, allowed_strategy W4_RECOVER
CRASH    -> risk_budget 0.00, allowed_strategy CASH
```

## Historical Backtest Plan

### Step 1. Build Snapshot CSV

Create script:

```text
backtest_market_regime_model.py
```

Outputs:

```text
.Codex/reports/2026-05-27_market-regime-snapshot.csv
.Codex/reports/2026-05-27_market-regime-model.md
```

Requirements:
- Use PostgreSQL `market_daily_price`.
- Use KOSPI/KOSDAQ index rows.
- Use stock universe rows for breadth/liquidity.
- No future data.
- One row per trade date.

### Step 2. Regime Breakdown For Existing W4/V3-FIN

Create script:

```text
backtest_v3fin_regime_router.py
```

Inputs:

```text
.Codex/reports/2026-05-27_market-regime-snapshot.csv
.Codex/reports/2026-05-27_w4-v3fin-post-exit-grid-trades.csv
```

Outputs:

```text
.Codex/reports/2026-05-27_w4-v3fin-regime-router.md
.Codex/reports/2026-05-27_w4-v3fin-regime-router-trades.csv
```

Report:
- pre/train/post by regime
- trade count by regime
- avg monthly by regime
- worst month by regime
- win rate by regime
- early fail count by regime

### Step 3. Router Policy Backtest

Test policies:

```text
router_v1:
  BULL     -> allow current best W4/V3-FIN
  SIDEWAYS -> allow only stricter entry
  BEAR     -> block W4 breakout
  CRASH    -> cash only

router_v2:
  BULL     -> current best W4/V3-FIN
  SIDEWAYS -> current best but half risk
  BEAR     -> W4_RECOVER placeholder / no-trade
  CRASH    -> cash only
```

Promotion criteria:

```text
pre avg monthly > 0
train avg monthly >= 40%
train worst >= -13%
train win >= 70%
post avg monthly >= 0
post N not lower than baseline unless risk clearly improves
```

## Realtime Backend Plan

After backtest formula accepted, implement backend snapshot flow.

Suggested table:

```sql
CREATE TABLE quant_market_regime_snapshot (
    trade_date DATE PRIMARY KEY,
    regime VARCHAR(20) NOT NULL,
    confidence NUMERIC(8, 6) NOT NULL,
    risk_budget NUMERIC(8, 6) NOT NULL,
    allowed_strategy VARCHAR(50) NOT NULL,
    bull_score NUMERIC(8, 6) NOT NULL,
    bear_score NUMERIC(8, 6) NOT NULL,
    stress_score NUMERIC(8, 6) NOT NULL,
    breadth_ma20 NUMERIC(8, 6),
    breadth_ma60 NUMERIC(8, 6),
    volatility_20 NUMERIC(12, 8),
    liquidity_trend NUMERIC(12, 8),
    created_at TIMESTAMP DEFAULT now()
);
```

Realtime flow:

```text
market data refresh
-> calculate market regime snapshot
-> save quant_market_regime_snapshot
-> quant strategy reads latest snapshot where trade_date <= signal_date
-> strategy chooses stock rules by regime
```

## Current Quant Model Integration

Existing quant stock selection receives:

```text
regime snapshot
```

Then applies:

```text
if BULL:
  use W4/V3-FIN best candidate

if SIDEWAYS:
  use stricter entry or lower risk

if BEAR:
  skip W4 breakout; later use W4_RECOVER

if CRASH:
  no picks
```

## Guardrails

- Avoid look-ahead bias.
- Regime snapshot for `signal_date` must use only `trade_date <= signal_date`.
- Do not train ML first.
- Rule-based model first, ML later.
- Keep signal date, regime date, execution date separate.
- Record all meaningful backtest outputs under `quant-model-lab/.Codex`.

## Claude Handoff

Recommended execution order:

1. Implement `market_regime_model.py` pure classifier.
2. Add small tests for BULL/SIDEWAYS/BEAR/CRASH.
3. Implement historical snapshot script.
4. Generate snapshot report.
5. Join W4/V3-FIN trades with regime.
6. Build router policy report.
7. Only after report, decide backend table/service implementation.

Do not implement backend realtime table until historical router proves useful.
