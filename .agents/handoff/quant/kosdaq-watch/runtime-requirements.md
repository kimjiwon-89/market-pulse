# kosdaq-watch-v0.1.0 Runtime Handoff

## Requested Runtime

Create a disabled, paper-shadow-only KOSDAQ watch runtime that emits KOSDAQ regime state from the market-supervisor classifier.

## Required Production Behavior

1. Load cached slow features from the latest closed market data.
2. Read live KOSDAQ index price from the approved quote provider.
3. Keep KOSPI live and cached features available because the current supervisor computes conservative combined routing state.
4. Compute KOSDAQ single-index regime with `classify_regime_kosdaq`.
5. Compute combined supervisor regime with conservative merge when writing shared routing state.
6. Save snapshots with data freshness metadata.
7. Hide user-facing output when cache is missing, quote data is stale, or provider disconnects.
8. Never place orders from this runtime.

## Suggested Storage

Use the existing prototype table name only as a starting point:

```text
quant_market_regime_snapshot
```

If production separates per-market watch output, add scope-aware keys:

```text
runtime_config_key
market_scope
trade_date
snapshot_at
regime
risk_budget
allowed_strategy
data_freshness_status
```

## Acceptance Checks

- A known bullish fixture emits `KOSDAQ/BULL/W4_BREAKOUT/1.0`.
- A known bearish fixture emits `KOSDAQ/BEAR/W4_RECOVER/0.2`.
- A crash fixture emits `KOSDAQ/CRASH/CASH/0.0`.
- Stale cache hides output rather than serving a confident regime.
- Runtime config remains `enabled=false`, `publicExposure=false`, and `liveOrdersEnabled=false`.
