# Leading Model Improvement Direction

date: 2026-05-27
model: MarketSupervisor / LeadingModel
status: direction set / needs accumulated ETP data

## Summary

The current market regime model classifies the present market state. It is useful for exposure control, but it is not strong enough by itself as a forward-entry filter for Bull V4.

The leading model should be a separate forward-direction filter:

```text
MarketRegimeModel = current state classifier
LeadingModel      = next 5-20 trading day direction predictor
MarketSupervisor  = combines both and routes models
```

## Current Validation

Existing OHLCV proxy features show a weak but usable signal:

| signal | KOSPI D+20 avg | D+20 win rate |
|---|---:|---:|
| BULL_LEAD | +1.50% | 62.57% |
| NEUTRAL | +0.31% | 52.75% |
| BEAR_LEAD | +0.94% | 55.17% |

This passes direction ordering, but the spread is not large enough to be the only gate.

## Why ETP Data Matters

Bull V4 enters high-momentum stocks. Those entries are sensitive to whether market participants are still adding risk or already hedging.

ETP data can improve this because it directly reflects risk appetite:

| feature family | expected use |
|---|---|
| leveraged ETF volume/value | risk-on participation proxy |
| inverse ETF volume/value | hedge/risk-off demand proxy |
| leverage / inverse ratio | direction and confidence filter |
| ratio slope 3d/5d/20d | early turn detection |
| ETP value share of market value | crowding/stress proxy |
| KOSDAQ lead vs KOSPI | growth/risk appetite proxy |

## Recommended Feature Set

Add these after ETP accumulation is stable:

```text
lvrg_invrs_amt_ratio
lvrg_invrs_vol_ratio
lvrg_invrs_ratio_5d_change
inverse_amt_5d_zscore
leveraged_amt_5d_zscore
etp_risk_on_score
short_sell_amt_ratio
short_sell_amt_5d_change
kosdaq_kospi_ret5_spread
breadth_thrust
breadth_5d_change
market_liquidity_20d_ratio
```

## Model Direction

Use a simple scorecard first, then upgrade only if it improves out-of-sample behavior.

### Step 1. Scorecard

```text
BULL_LEAD if:
  breadth_thrust positive
  KOSDAQ leads KOSPI
  leveraged/inverse ratio rising
  inverse demand not spiking
  liquidity not deteriorating

BEAR_LEAD if:
  inverse demand spikes
  breadth deteriorates
  KOSDAQ lags KOSPI
  short-sell pressure rises
```

### Step 2. Walk-Forward Validation

Validate by year and by market regime:

```text
train: rolling 3 years
test: next 6 months
targets: KOSPI/KOSDAQ D+5, D+10, D+20 return
metrics: spread, win rate, drawdown avoided, Bull V4 trade filter impact
```

### Step 3. Bull V4 Integration

Use the leading model as a soft gate first:

| leading signal | Bull V4 action |
|---|---|
| BULL_LEAD | normal entry |
| NEUTRAL | halve position size or require stricter confirmation |
| BEAR_LEAD | block new entries, keep only exit management |

This avoids throwing away Bull V4 opportunities before enough ETP history exists.

## Accuracy Upgrade Checklist

- Accumulate at least 30 trading days of ETP and short-sell snapshots before trusting the new feature family.
- Do not train on the same period used to tune Bull V4 entry filters.
- Track whether filtering improves portfolio result, not only index prediction.
- Store the leading score used at each Bull V4 signal date so every entry can be audited later.

## Decision

The ETP pipeline is worth keeping. It should not replace the regime model; it should become a forward filter inside MarketSupervisor and a Bull V4 entry-size/risk gate.

