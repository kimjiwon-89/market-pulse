# Regime Tracking — Iter 1: Baseline (현재 모델)

date: 2026-05-27

## 예측 안정성 (D 판단 vs 실제)

| 기간 | 일치율 | N |
|---|---:|---:|
| D+ 1d | 84.2% | 3476 |
| D+ 5d | 69.4% | 3472 |
| D+10d | 57.7% | 3467 |
| D+21d | 45.5% | 3456 |

## Regime별 D+5 안정성

| regime | 일치율 | N |
|---|---:|---:|
| BEAR | 68.6% | 723 |
| BULL | 62.9% | 828 |
| SIDEWAYS | 72.5% | 1921 |

## 전환 패턴 (D → D+5)

| D | D+5 | 횟수 | 비율 |
|---|---|---:|---:|
| BEAR | BEAR | 496 | 68.6% |
| BEAR | BULL | 3 | 0.4% |
| BEAR | SIDEWAYS | 224 | 31.0% |
| BULL | BEAR | 2 | 0.2% |
| BULL | BULL | 521 | 62.9% |
| BULL | SIDEWAYS | 305 | 36.8% |
| SIDEWAYS | BEAR | 225 | 11.7% |
| SIDEWAYS | BULL | 304 | 15.8% |
| SIDEWAYS | SIDEWAYS | 1392 | 72.5% |

## 개선사항

- 단순 당일 판단, 필터 없음
- → D+1 안정성이 낮으면 persistence filter 적용 (Iter 2)
- → 특정 regime에서 전환 빈도 높으면 경계 감지 추가 (Iter 3)

- Detail: `.Codex/reports/2026-05-27_regime-tracking-iter1-detail.csv`
