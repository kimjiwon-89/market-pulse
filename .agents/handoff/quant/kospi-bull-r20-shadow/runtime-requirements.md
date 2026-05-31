# kospi-bull-r20-shadow-v0.1.0 Runtime Handoff

## Required Runtime Inputs

- `market_daily_price` STOCK rows with OHLCV and sector.
- `market_daily_price` INDEX rows for `KOSPI` and `KOSDAQ`.
- Derived rolling features: MA20, MA60, ret60, range20, candle location, upper shadow, body return, volume expansion, MA slopes, and trade amount.
- Runtime config: `runtime-config.json` in this package.

## Required Runtime Behavior

1. Build STOCK universe from `market_daily_price`.
2. Map exchange as `KOSPI` only when `sector == 'KOSPI'`.
3. Keep only `KOSPI` stocks before candidate ranking.
4. Apply shared bull regime gate: KOSPI above MA20 and KOSDAQ above MA20 on signal date.
5. Apply R20 signal filters and rank by `range20 + ret60 + ma60Dist`.
6. Apply delayed entry confirmation after five tradable days.
7. Enforce same-asset open guard and rolling 15-calendar-day cap of four entries.
8. Simulate paper-only exits with early fail, stop, profit floor, trailing giveback, and R20 conditional max-hold extension.
9. Store paper-shadow facts keyed by `runtimeConfigKey = kospi-bull-r20-shadow-v0.1.0`.
10. Serve only admin/debug summaries until forward evidence review is approved.

## Suggested Cache Fields

```text
runtime_config_key
model_code
model_version
market_scope
signal_date
asset_code
asset_name
candidate_rank
score
entry_check_date
entry_date
virtual_entry_price
virtual_exit_date
virtual_exit_price
return_pct
cost_pct
exit_reason
position_cash_krw
paper_pnl_krw
range20
ret60
ma60_dist
entry_next_body
signal_trade_amount
conditional_extension_applied
kospi_above_ma20
kosdaq_above_ma20
cache_generated_at
```

## Forward Evidence Window

- Minimum review window: 4 weeks.
- Preferred review window: 8 weeks or at least 10 virtual entries.
- Required lab review after accumulation:
  - compare signal count, entry count, skipped count, and exit reason distribution;
  - measure top contributor share;
  - measure return without top one, top two, and top three contributors;
  - compare live paper facts with lab replay logic for the same dates.

## Acceptance Checks

- Production replay includes no KOSDAQ stock candidates.
- Live order code path rejects this runtime config key.
- Public API and homepage do not expose this model.
- Admin/debug view labels the model as `paper-shadow` and `not approved for live trading`.
- Cache/fact rows are isolated by `runtime_config_key`.
- Daily paper generation records skipped candidates and skip reasons.
- Replay fact count can be compared against lab output for the restored seed window.

## Stop Conditions

- Any public exposure is detected.
- Any live order path accepts this config key.
- KOSDAQ stocks enter the selected candidate set.
- Required KOSPI/KOSDAQ index rows are missing.
- Paper cache is stale or empty for more than two consecutive market sessions.
