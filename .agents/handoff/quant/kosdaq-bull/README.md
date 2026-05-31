# kosdaq-bull-v1.0.0 Prod Handoff

Status: prod review input and visible paper-runtime shell
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
- Prod list status: `APPROVED` for paper-runtime screen visibility only

## Required Prod Handling

- Treat this folder as review and implementation input only.
- Do not execute uploaded lab files inside the production API.
- Implement accepted Java/rule-based behavior under `apps/api/src/main/java/com/marketpulse/domain/quant/live/service/` using `LiveQuantModelRuntime`.
- Serve user/API data from production-owned replay cache or serving tables only.
- Show as a package-ready paper-runtime model shell on `/quant`.
- Keep `runtime_ready=false`; no `LiveQuantModelRuntime` exists yet.
- Keep live orders disabled until prod has runtime implementation, replay-cache reproduction, validation pass, admin approval, and explicit live-order approval.
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
- Admin UI marks the model as paper-only and package-ready.
- Public model-list exposure is enabled for the shell only; live orders remain disabled unless later explicitly approved.
