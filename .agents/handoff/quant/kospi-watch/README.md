# kospi-watch-v0.1.0 Prod Handoff

Status: prod review input and visible monitor shell
Received: 2026-05-31
Source: `market-pulse-lab/domains/quant/model-candidates/KOSPI_WATCH/kospi-watch-v0.1.0`

## Identity

- Registry family: `KOSPI_WATCH`
- Prod package code: `KOSPI_WATCH`
- Model code: `kospi-watch`
- Model version: `0.1.0`
- Runtime config key: `kospi-watch-v0.1.0`
- Market scope: `KOSPI`
- Lab status: `VALIDATING`
- Prod list status: `APPROVED` for paper-shadow screen visibility only

## Required Prod Handling

- Show as a package-ready watch/monitor shell on `/quant`.
- Keep `runtime_ready=false`; no independent production watch runtime exists yet.
- Use as a regime gate/monitor only.
- Do not select stocks, size positions, or place orders.
- Production quote provider and disconnect fallback must be reviewed before activation.

## Next Prod Agent Action

Wire KOSPI watch to the existing `MarketRegimeMonitorService` output only after confirming index source codes, cache freshness policy, and disconnect fallback.
