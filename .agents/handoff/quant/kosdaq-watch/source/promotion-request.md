# kosdaq-watch-v0.1.0 Promotion Request

## Request

- Requested action: `REVIEW_FOR_PROD_PAPER_SHADOW`
- Requested prod status: `PAPER_SHADOW_ONLY`
- Requested runtime config key: `kosdaq-watch-v0.1.0`
- Public exposure requested: `false`
- Live orders requested: `false`

## Scope

This request covers only KOSDAQ regime/watch monitoring. It does not approve stock selection, portfolio sizing, public display, or live execution.

## Artifacts

- Candidate package: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/candidate.md`
- Runtime config: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/runtime-config.json`
- Runtime handoff: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/runtime-handoff.md`
- Validation report: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/validation.md`
- Metrics JSON: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/metrics.json`
- Feature schema: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/feature-schema.json`
- Output schema: `domains/quant/model-candidates/KOSDAQ_WATCH/kosdaq-watch-v0.1.0/output-schema.json`

## Required Production Review

- Confirm KOSDAQ live index quote source.
- Confirm cached feature generation cadence.
- Confirm snapshot freshness and fallback policy.
- Confirm that public/API exposure is disabled by default.
- Confirm that this monitor cannot place orders.
