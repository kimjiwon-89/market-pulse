# kosdaq-bull-v1.0.0 Candidate Package

## Identity

- Family: `KOSDAQ_BULL`
- Model code: `kosdaq-bull`
- Model version: `1.0.0`
- Runtime config key: `kosdaq-bull-v1.0.0`
- Owner: `market-pulse-lab`
- Lab status: `READY_FOR_APPROVAL`
- Market scope: `KOSDAQ`
- Package path: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0`
- Created date: `2026-05-29`

## Purpose

`kosdaq-bull-v1.0.0` is the runtime handoff package for the KOSDAQ-only bull model selected from `BULL_V5_KOSDAQ`.

This package is ready for production runtime implementation review. It does not approve public exposure or live orders. Production must implement the runtime, replay cache, and admin approval from the production repository.

## Source Candidate

- Source lab candidate: `domains/quant/model-candidates/BULL/BULL_V5_KOSDAQ`
- Selected source variant: `KOSDAQ_BULL_V5_RET60_MAX_100`
- Source test report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test.md`
- Source trades CSV: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test-trades.csv`

## Runtime Contract

- Runtime expectation: `JAVA_RUNTIME`
- Implementation key: `kosdaq-bull-v1.0.0`
- Expected runtime class: production may implement as `KosdaqBullRuntime` or a parameterized bull runtime keyed by `runtimeConfigKey`.
- Public exposure default: `false`
- Admin exposure default: `paper_only`
- Cache requirement: use precomputed replay facts; do not run long historical replay inside user-facing requests.

## Universe

- Include only STOCK rows whose exchange map resolves to `KOSDAQ`.
- Exchange map rule used in lab: `sector == KOSPI` maps to KOSPI; all other STOCK sectors map to KOSDAQ.
- Keep `KOSPI` and `KOSDAQ` INDEX rows available for the shared bull regime gate.
- Exclude KOSPI-listed STOCK candidates from selection and ranking.

## Signal Rules

```text
entry_delay_days = 5
entry_loc_min = 0.55
entry_ma20_dist_min = 0.02
entry_next_body_min = 0.005
range20_max = 0.40
ret60_max = 1.00
top_n = 50
regime_gate = KOSPI > MA20 and KOSDAQ > MA20
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

If production needs a 100,000,000 KRW paper seed, scale `position_cash_krw` to `10,000,000` and keep percentage returns unchanged.

## Exit Policy

- Early fail: first 3 days close return <= `-6%`, reported net return `-6.3%`.
- Stop: low return <= `-12%`, reported net return `-12.3%`.
- Trail: after peak >= `+20%`, exit when close <= peak - `20%`.
- Conditional extension: if day 30 return >= `+25%` and close > MA20, max hold extends to 60 days.
- Cost assumption: `0.3%` net trading cost embedded in reported exit returns.

## Validation Result

Focused KOSDAQ-only seed test:

| Period | Trades | Total Return | Avg Month | Worst Month | MDD | Win Rate |
|---|---:|---:|---:|---:|---:|---:|
| train | 19 | 55.80% | 3.99% | -1.23% | -1.66% | 68.42% |
| post | 15 | 38.25% | 4.78% | -1.86% | -1.86% | 53.33% |

Baseline comparison:

- KOSDAQ-only BULL_V4 baseline train total return: `53.31%`
- KOSDAQ-only BULL_V4 baseline post total return: `62.23%`
- `kosdaq-bull-v1.0.0` improves train quality and drawdown, but gives up post-period sample count and post total return.

## Runtime Approval Gate

Production can attach this package as a paper runtime only after:

- `quant_model_version` or equivalent runtime registry row is added with `runtimeConfigKey = kosdaq-bull-v1.0.0`.
- Replay cache is generated for the same date windows and matches lab trade count within an approved tolerance.
- Admin UI marks the model as paper-only and not public by default.
- KOSDAQ-only universe filter is verified with production data.
- Cache freshness and data readiness are surfaced before any API summary is shown.

## KOSPI Status

KOSPI is not included in this runtime. `BULL_V5_KOSPI` needs a separate sample-recovery improvement pass before it can become a runtime handoff package.
