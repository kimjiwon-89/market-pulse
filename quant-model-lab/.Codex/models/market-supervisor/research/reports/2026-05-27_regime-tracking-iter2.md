# Regime Tracking — Iter 2: Persistence Filter (3d)

date: 2026-05-27

## 예측 안정성 (D 판단 vs 실제)

| 기간 | 일치율 | N |
|---|---:|---:|
| D+ 1d | 94.4% | 3476 |
| D+ 5d | 74.9% | 3472 |
| D+10d | 61.1% | 3467 |
| D+21d | 46.3% | 3456 |

## Regime별 D+5 안정성

| regime | 일치율 | N |
|---|---:|---:|
| BEAR | 75.9% | 709 |
| BULL | 67.5% | 813 |
| SIDEWAYS | 77.7% | 1950 |

## 전환 패턴 (D → D+5)

| D | D+5 | 횟수 | 비율 |
|---|---|---:|---:|
| BEAR | BEAR | 538 | 75.9% |
| BEAR | SIDEWAYS | 171 | 24.1% |
| BULL | BULL | 549 | 67.5% |
| BULL | SIDEWAYS | 264 | 32.5% |
| SIDEWAYS | BEAR | 171 | 8.8% |
| SIDEWAYS | BULL | 264 | 13.5% |
| SIDEWAYS | SIDEWAYS | 1515 | 77.7% |

## 개선사항

- 3일 연속 동일 regime 확인 후 전환 (1일짜리 노이즈 제거)
- → D+1 안정성 기준치: 84.2% (iter1)

- Detail: `.Codex/reports/2026-05-27_regime-tracking-iter2-detail.csv`
