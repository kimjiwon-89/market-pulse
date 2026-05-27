# Regime SIDEWAYS Split Test

date: 2026-05-27

SIDEWAYS 세분화 기준:
  SIDEWAYS_UP   : KOSPI+KOSDAQ MA20 slope 모두 양수 AND breadth_ma20 > 0.50
  SIDEWAYS_DOWN : KOSPI+KOSDAQ MA20 slope 모두 음수 AND breadth_ma20 < 0.45
  SIDEWAYS_FLAT : 나머지

진입 조건:
  BULL         : 기존 entry_ma20_min
  SIDEWAYS_UP  : entry_next_body_min=0.01, entry_ma20_min=0.05 (완화)
  SIDEWAYS_FLAT: entry_next_body_min=0.02, entry_ma20_min=0.08 (엄격)

## Results

| policy | pass | pre avg | train avg | train worst | train win | train N | post avg | post N |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| baseline_strict | Y | 11.45% | 53.59% | 12.96% | 100.00% | 5 | 56.57% | 1 |
| up_only | Y | 8.10% | 53.59% | 12.96% | 100.00% | 5 | 56.57% | 1 |
| up_and_flat | Y | 11.45% | 53.59% | 12.96% | 100.00% | 5 | 56.57% | 1 |
| bull_only | Y | 8.10% | 53.59% | 12.96% | 100.00% | 5 | 56.57% | 1 |

## SIDEWAYS Sub-regime Breakdown (train, baseline_strict)

| regime | avg ret | N | win |
|---|---:|---:|---:|
| BULL | 53.59% | 5 | 100.00% |

## Notes

- SIDEWAYS_UP이 좋으면: BULL 정의를 완화할 여지 있음.
- SIDEWAYS_DOWN이 나쁘면: slope 음전환 시 차단이 효과적.
- SIDEWAYS_FLAT이 불안정하면: FLAT 차단이 안전.
- Trades: `.Codex/reports/2026-05-27_regime-sideways-split-trades.csv`
