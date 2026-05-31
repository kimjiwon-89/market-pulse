# kosdaq-bull-v1.0.0 Runtime Handoff

## Required Runtime Inputs

- `market_daily_price` STOCK rows with OHLCV and sector.
- `market_daily_price` INDEX rows for `KOSPI` and `KOSDAQ`.
- Derived rolling features: MA20, MA60, ret60, range20, candle location, upper shadow, body return, volume expansion, MA slopes.
- Runtime config: `runtime-config.json` in this package.

## Required Runtime Behavior

1. Build stock universe from `market_daily_price`.
2. Map exchange as `KOSPI` only when `sector == 'KOSPI'`; otherwise map STOCK row to `KOSDAQ`.
3. Keep only `KOSDAQ` stocks before candidate ranking.
4. Apply shared bull regime gate: KOSPI above MA20 and KOSDAQ above MA20 on signal date.
5. Apply signal filters and rank by the existing BULL score.
6. Apply delayed entry confirmation.
7. Simulate exit with early-fail, stop, trail, and conditional extension policy.
8. Store replay facts keyed by `runtimeConfigKey = kosdaq-bull-v1.0.0`.
9. Serve summaries from cache only.

## Suggested Cache Fields

```text
runtime_config_key
model_code
model_version
market_scope
signal_date
asset_code
asset_name
entry_check_date
entry_date
exit_date
entry_price
exit_price
return_pct
cost_pct
exit_reason
range20
ret60
ma60_dist
entry_next_body
kospi_above_ma20
kosdaq_above_ma20
cache_generated_at
```

## Acceptance Checks

- Production replay includes no KOSPI stock candidates.
- Production replay has KOSDAQ train/post trade counts close to lab counts for the same date windows.
- Runtime summary hides when STOCK or INDEX data is incomplete.
- Runtime summary hides when replay cache is empty or stale.
- Public exposure remains false after initial attachment.
