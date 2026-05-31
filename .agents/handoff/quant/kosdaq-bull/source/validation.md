# kosdaq-bull-v1.0.0 Validation

## Reproducible Command

```powershell
cd D:\market-pulse\market-pulse-lab\domains\quant\legacy-quant-model-lab
$env:PYTHONPATH='D:\market-pulse\market-pulse-lab\domains\quant\legacy-quant-model-lab\.Codex\models\market-supervisor\research\scripts;D:\market-pulse\market-pulse-lab\domains\quant\legacy-quant-model-lab\.Codex\models\bull-v4\scripts\legacy-root'
python .Codex\models\bull-v4\scripts\backtest_v3fin_market_scope_v5.py
```

## Output

- Report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test.md`
- Trades: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-29_bull-v5-market-scope-test-trades.csv`

## Result

Selected row: `KOSDAQ_BULL_V5_RET60_MAX_100`

| Period | N | Total | Avg Month | Worst Month | MDD | Win | Early | Stop |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| train | 19 | 55.80% | 3.99% | -1.23% | -1.66% | 68.42% | 1 | 4 |
| post | 15 | 38.25% | 4.78% | -1.86% | -1.86% | 53.33% | 1 | 3 |

## Baseline Comparison

KOSDAQ-only BULL_V4 baseline:

| Period | N | Total | Avg Month | MDD | Win |
|---|---:|---:|---:|---:|---:|
| train | 22 | 53.31% | 3.14% | -3.48% | 59.09% |
| post | 21 | 62.23% | 6.91% | -3.09% | 57.14% |

## Verdict

- Validation status: `READY_FOR_APPROVAL`
- Runtime handoff status: ready for paper runtime implementation review
- Public exposure: not approved
- Live orders: not approved

The model improves train quality and drawdown versus the KOSDAQ-only baseline. It is less aggressive in the post period, with lower post total return and fewer trades. Treat it as a risk-controlled KOSDAQ bull runtime candidate.
