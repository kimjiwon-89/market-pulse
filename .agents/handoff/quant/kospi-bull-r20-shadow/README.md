# kospi-bull-r20-shadow-v0.1.0 Prod Handoff

Status: prod review input and visible paper-shadow shell
Received: 2026-05-31
Source: `market-pulse-lab/domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0`

## Identity

- Registry family: `KOSPI_BULL`
- Prod package code: `KOSPI_BULL`
- Model code: `kospi-bull-r20-shadow`
- Model version: `0.1.0`
- Runtime config key: `kospi-bull-r20-shadow-v0.1.0`
- Market scope: `KOSPI`
- Lab status: `VALIDATING`
- Prod list status: `APPROVED` for paper-shadow screen visibility only

## Required Prod Handling

- Show as a package-ready paper-shadow model shell on `/quant`.
- Keep `runtime_ready=false`; no `LiveQuantModelRuntime` exists yet.
- Do not place live orders.
- Do not treat this handoff as public/live approval.
- Runtime implementation must be production-owned Java or controlled serving code under `apps/api`.
- Serve future signal/trade data from production replay/cache tables, not from lab files.

## Files

- `validation.md`: lab validation summary.
- `runtime-requirements.md`: runtime input, cache, and acceptance contract.
- `artifacts/`: copied machine-readable config, metrics, feature schema, and output schema.
- `source/`: copied lab `candidate.md` and `promotion-request.md` for traceability.

## Next Prod Agent Action

Implement only a disabled/admin-private paper-shadow runtime review first, then reproduce the replay cache before any runtime activation. Public exposure and live orders remain blocked.
