# kosdaq-bull-v1.0.0 Prod Handoff

Status: prod review input only
Received: 2026-05-30
Source: `market-pulse-lab/domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0`

## Identity

- Family: `KOSDAQ_BULL`
- Model code: `kosdaq-bull`
- Model version: `1.0.0`
- Runtime config key: `kosdaq-bull-v1.0.0`
- Market scope: `KOSDAQ`
- Requested prod action: `REVIEW_FOR_PROD_RUNTIME`
- Requested prod status: `READY_FOR_APPROVAL`
- Initial exposure: paper-only, admin-only

## Required Prod Handling

- Treat this folder as review and implementation input only.
- Do not execute uploaded lab files inside the production API.
- Implement accepted Java/rule-based behavior under `apps/api/src/main/java/com/marketpulse/domain/quant/live/service/` using `LiveQuantModelRuntime`.
- Serve user/API data from production-owned replay cache or serving tables only.
- Keep public exposure disabled until prod has runtime implementation, replay-cache reproduction, validation pass, admin approval, and explicit visibility enablement.
- Do not approve live orders from this handoff.
- Any DB schema change must be implemented through reviewed prod migrations.

## Files

- `validation.md`: copied validation summary for prod review.
- `runtime-requirements.md`: runtime input, behavior, cache, and acceptance contract.
- `artifacts/runtime-config.json`: machine-readable runtime config.
- `artifacts/metrics.json`: lab metrics summary.
- `artifacts/feature-schema.json`: expected feature inputs.
- `artifacts/output-schema.json`: expected output shape.
- `source/`: full lab package copied verbatim for traceability.

## Acceptance Checks Before Implementation Is Considered Ready

- Production replay includes no KOSPI stock candidates.
- Production replay trade counts match lab counts within an approved tolerance for the same date windows.
- Runtime hides when STOCK or INDEX source data is incomplete.
- Runtime hides when replay cache is empty or stale.
- Admin UI marks the model as paper-only and not public by default.
- Public API exposure remains disabled unless later explicitly approved.
