# kospi-bull-r20-shadow-v0.1.0 Validation

## Reproducible Commands

Run from:

```bash
cd /Users/gim-yeong-ug/Desktop/market-pulse/project-market-pulse/market-pulse-lab/market-pulse-lab/domains/quant/legacy-quant-model-lab
```

Environment:

```bash
MP_DB_NAME=marketpulse_seed_20260528 \
MP_DB_USER=gim-yeong-ug \
MP_DB_PASSWORD='' \
PYTHONPATH='.Codex/models/market-supervisor/research/scripts:.Codex/models/bull-v4/scripts/legacy-root:.Codex/models/bull-v4/scripts'
```

Core R20 reproduction:

```bash
python3 .Codex/models/bull-v4/scripts/backtest_kospi_r19_condition_sensitivity.py
```

Robustness and sizing:

```bash
python3 .Codex/models/bull-v4/scripts/analyze_kospi_r20_robustness_suite.py
```

Rejected follow-ups:

```bash
python3 .Codex/models/bull-v4/scripts/backtest_kospi_r20_liq_entry_relaxation.py
python3 .Codex/models/bull-v4/scripts/backtest_kospi_r20_profit_floor_sensitivity.py
python3 .Codex/models/bull-v4/scripts/backtest_kospi_r20_targeted_trend_grace.py
```

## Output

- R20 source report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r19-condition-sensitivity.md`
- R20 source trades: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r19-condition-sensitivity-trades.csv`
- Robustness report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-robustness-suite.md`
- Sizing scenarios: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-sizing-scenarios.csv`
- Entry relaxation report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-liq-entry-relaxation.md`
- Profit-floor report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-profit-floor-sensitivity.md`
- Targeted trend-grace report: `domains/quant/legacy-quant-model-lab/.Codex/reports/2026-05-30_kospi-r20-targeted-trend-grace.md`

## Result

Selected row: `KOSPI_R20_LIQ_RETLOW030`

| Period | N | Total | MDD | Sharpe | Win | Stop |
|---|---:|---:|---:|---:|---:|---:|
| train | 29 | 39.18% | -3.52% | 1.74 | 51.72% | 27.59% |
| post | 10 | 81.87% | not separately measured | not separately measured | 70.00% | not separately measured |

## Robustness

| Scenario | Post Total |
|---|---:|
| actual | 81.87% |
| remove top 1 | 43.10% |
| remove top 2 | 20.49% |
| remove top 3 | 3.49% |
| cap each trade at 50% | 18.49% |
| cap each trade at 100% | 33.49% |
| cap each trade at 200% | 60.49% |

## Rejected Follow-Ups

| Direction | Result | Decision |
|---|---|---|
| high-liquidity `range20_max` entry relaxation | candidate rows increase, executed trades unchanged | reject without ranking change |
| global profit-floor relaxation | train/pre weaken and `삼성전기` worsens | reject |
| targeted MA20 trend-grace | post falls to 81.49%; `삼성전기` worsens | reject |
| targeted MA60 trend-grace | neutral versus R20 | reject as unnecessary complexity |

## Verdict

- Validation status: `VALIDATING`
- Runtime handoff status: ready for paper-shadow implementation review only
- Public exposure: not approved
- Live orders: not approved
- Required follow-up: accumulate 4-8 weeks of forward paper-shadow evidence and rerun robustness checks.

R20 is the current best KOSPI validation seed, but not a production trading model. The package exists to collect forward evidence in production-like data flow without exposing the model publicly or placing live orders.
