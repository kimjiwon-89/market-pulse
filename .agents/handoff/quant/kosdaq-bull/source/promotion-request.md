# kosdaq-bull-v1.0.0 Promotion Request

## Request

- Requested action: `REVIEW_FOR_PROD_RUNTIME`
- Family: `KOSDAQ_BULL`
- Model code: `kosdaq-bull`
- Model version: `1.0.0`
- Lab status: `READY_FOR_APPROVAL`
- Requested prod status: `READY_FOR_APPROVAL`
- Requested runtime config key: `kosdaq-bull-v1.0.0`
- Public exposure expected: `false`
- Live orders expected: `false`

## Evidence Links

- Candidate package: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/candidate.md`
- Runtime config: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/runtime-config.json`
- Validation report: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/validation.md`
- Metrics JSON: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/metrics.json`
- Feature schema: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/feature-schema.json`
- Output schema: `domains/quant/model-candidates/KOSDAQ_BULL/kosdaq-bull-v1.0.0/output-schema.json`
- Source test report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test.md`
- Source trades CSV: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test-trades.csv`

## Production Impact

- API impact: add a KOSDAQ-only paper bull runtime keyed by `kosdaq-bull-v1.0.0`.
- DB impact: add model version/config metadata and a KOSDAQ bull replay cache table or config-keyed replay facts. No destructive migration is approved from lab.
- Worker/runtime impact: replay precompute must run after daily STOCK/INDEX collection and must filter candidates to KOSDAQ before ranking.
- Admin UI impact: expose as paper-only, show market scope, runtime config key, cache date, data readiness, train/post metrics, and warning count.
- Public exposure: keep disabled until production admin approval.

## Rollback Recommendation

Hide `kosdaq-bull-v1.0.0` or roll back to the existing BULL paper runtime if replay cache is empty, KOSDAQ universe filtering fails, production replay trade count diverges from lab by more than approved tolerance, or post-period risk metrics worsen after cache reproduction.

## Safety Notes

- This package approves runtime implementation review only.
- It does not approve live orders.
- It does not approve public homepage exposure.
- Production implementation must happen in the production repository.
