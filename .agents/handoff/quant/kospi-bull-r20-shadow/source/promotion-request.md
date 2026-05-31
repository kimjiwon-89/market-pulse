# kospi-bull-r20-shadow-v0.1.0 Promotion Request

## Request

- Requested action: `REVIEW_FOR_PROD_PAPER_SHADOW`
- Family: `KOSPI_BULL`
- Model code: `kospi-bull-r20-shadow`
- Model version: `0.1.0`
- Lab status: `VALIDATING`
- Requested prod status: `PAPER_SHADOW_ONLY`
- Requested runtime config key: `kospi-bull-r20-shadow-v0.1.0`
- Public exposure expected: `false`
- Live orders expected: `false`

## Evidence Links

- Candidate package: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/candidate.md`
- Runtime config: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/runtime-config.json`
- Runtime handoff: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/runtime-handoff.md`
- Validation report: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/validation.md`
- Metrics JSON: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/metrics.json`
- Feature schema: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/feature-schema.json`
- Output schema: `domains/quant/model-candidates/KOSPI_BULL/kospi-bull-r20-shadow-v0.1.0/output-schema.json`
- Source R20 report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r19-condition-sensitivity.md`
- Robustness report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-robustness-suite.md`

## Production Impact

- API impact: add no public endpoint by default; admin/debug summary only if production explicitly wires it.
- DB impact: add model version/config metadata and isolated paper-shadow replay facts keyed by `runtime_config_key`. No destructive migration is approved from lab.
- Worker/runtime impact: daily paper-shadow generation after STOCK/INDEX collection; record signals, skips, virtual entries, virtual exits, and daily marks.
- Admin UI impact: label as paper-shadow, not approved for live trading, not public.
- Public exposure: must remain disabled.
- Live orders: must remain disabled.

## Rollback Recommendation

Hide or remove `kospi-bull-r20-shadow-v0.1.0` from production runtime registry if any of the following occur:

- replay cache is empty or stale for more than two consecutive market sessions;
- KOSDAQ stocks enter the selected candidate set;
- live order path accepts this config key;
- public endpoint exposes this model;
- production replay diverges from lab asset selection beyond approved tolerance on the same date range;
- forward paper evidence shows top-contributor concentration worse than lab stress thresholds.

## Safety Notes

- This package approves paper-shadow implementation review only.
- It does not approve live orders.
- It does not approve public homepage or public API exposure.
- Production implementation must happen in the production repository.
- Production schema changes require reviewed migrations in the production process.
