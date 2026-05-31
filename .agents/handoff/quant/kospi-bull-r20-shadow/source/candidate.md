# kospi-bull-r20-shadow-v0.1.0 Candidate Package

## Identity

- Family: `KOSPI_BULL`
- Model code: `kospi-bull-r20-shadow`
- Model version: `0.1.0`
- Runtime config key: `kospi-bull-r20-shadow-v0.1.0`
- Owner: `market-pulse-lab`
- Lab status: `VALIDATING`
- Market scope: `KOSPI`
- Package path: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0`
- Created date: `2026-05-30`

## Purpose

`kospi-bull-r20-shadow-v0.1.0` is a paper-shadow runtime handoff package for the current KOSPI R20 validation seed.

This package is intended to collect forward paper signals and virtual trade outcomes in production data flow. It does not approve public exposure, live orders, homepage exposure, or automated trading.

## Source Candidate

- Source lab candidate: `domains/quant/model-candidates/BULL/BULL_V5_KOSPI`
- Selected source variant: `KOSPI_R20_LIQ_RETLOW030`
- Source validation report: `domains/quant/model-candidates/BULL/BULL_V5_KOSPI/validation.md`
- Source test summary: `domains/quant/model-candidates/BULL/BULL_V5_KOSPI/test-summary.md`
- Source trade report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r19-condition-sensitivity.md`
- Source trade CSV: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r19-condition-sensitivity-trades.csv`

## Runtime Contract

- Runtime expectation: `JAVA_RUNTIME` or parameterized existing bull runtime.
- Implementation key: `kospi-bull-r20-shadow-v0.1.0`
- Expected runtime class: production may implement as `KospiBullR20ShadowRuntime` or a config-keyed generic bull replay runtime.
- Default enabled state: `false`
- Public exposure default: `false`
- Live orders default: `false`
- Admin exposure default: `paper_shadow_only`
- Cache requirement: store generated signals and paper replay facts; serve only admin/debug summaries until forward evidence is reviewed.

## Universe

- Include only STOCK rows whose exchange map resolves to `KOSPI`.
- Exchange map rule used in lab: `sector == KOSPI` maps to KOSPI; all other STOCK rows map to KOSDAQ.
- Keep `KOSPI` and `KOSDAQ` INDEX rows available for the shared bull regime gate.
- Exclude KOSDAQ-listed STOCK candidates from selection and ranking.

## Signal Rules

```text
range20_min = 0.15
range20_max = 0.40
ret60_min = 0.20
ret60_max = 1.05
ma60_dist_min = 0.05
vol_exp_max = 3.0
signal_candle_loc_min = 0.45
signal_upper_shadow_max = 0.12
trade_amount_min_krw = 500,000,000
score = range20 + ret60 + ma60_dist
top_n = 80
entry_delay_days = 5
entry_loc_min = 0.55
entry_ma20_dist_min = 0.02
entry_next_body_min = 0.020
entry_check_drop_min = -0.05
entry_body_ret_min = 0.0
entry_upper_shadow_max = 0.12
regime_gate = KOSPI > MA20 and KOSDAQ > MA20
same_asset_open_guard = true
rolling_entry_guard = 15 calendar days, max 4 entries
max_positions = 10
max_buys_per_signal_day = 5
liquidity_cap = position_cash <= 3% of signal-day trade amount
```

## Portfolio Defaults

```text
seed_capital_krw = 1,000,000,000
position_cash_krw = 100,000,000
target_weight_per_position_pct = 10.0
```

Micro-seed use is not part of this package. Sub-5,000,000 KRW use requires a separate integer-share, cash-constrained candidate because high-priced KOSPI stocks can be unbuyable at 10% target weight.

## Exit Policy

- Early fail: first 3 days close return <= `-6%`, reported net return `-6.3%`.
- Stop: low return <= `-12%`, reported net return `-12.3%`.
- Profit floor: after peak >= `+20%`, exit when close return <= `+12%`.
- Trail giveback: after peak >= `+20%`, exit when close <= peak - `30%`.
- Base max hold: 30 trading days.
- R20 conditional max-hold extension:
  - Applies only when signal-day trade amount >= `100,000,000,000 KRW`.
  - Applies only when signal `ret60 <= 0.30`.
  - If day-30 close return >= `+15%` and close > MA20, extend max hold to 120 trading days.
- Cost assumption: `0.3%` net trading cost embedded in reported returns.

## Validation Result

R20 restored-seed validation:

| Period | Trades | Total Return | MDD | Sharpe | Win Rate |
|---|---:|---:|---:|---:|---:|
| train | 29 | 39.18% | -3.52% | 1.74 | 51.72% |
| post | 10 | 81.87% | not separately measured | not separately measured | 70.00% |

Key stress:

- Post total without top winner `SK스퀘어`: `43.10%`.
- Post total without top two `SK스퀘어`, `삼성전자`: `20.49%`.
- Post total without top three `SK스퀘어`, `삼성전자`, `대덕전자`: `3.49%`.
- Cap each post trade at `50%`: `18.49%`.
- Cap each post trade at `100%`: `33.49%`.
- Cap each post trade at `200%`: `60.49%`.

## Runtime Approval Gate

Production may attach this package only as a disabled or admin-only paper-shadow runtime after:

- Runtime registry/config metadata is added with `runtimeConfigKey = kospi-bull-r20-shadow-v0.1.0`.
- Replay/paper fact storage is created or reused with config-key isolation.
- Public API and homepage exposure remain disabled.
- Live order paths reject this config key.
- Daily paper-shadow generation logs signal, skipped, entry, exit, and reason fields.
- Production replay for the same restored-seed window is compared against lab trade count and selected asset names within an approved tolerance.

## Known Limitations

- Not approved for live orders.
- Not approved for public exposure.
- Post-period performance remains concentrated in three large winners.
- R20 was derived from post high-riser diagnostics and needs forward evidence.
- High-liquidity entry relaxation and targeted trend-grace follow-ups did not improve the current R20 result.
