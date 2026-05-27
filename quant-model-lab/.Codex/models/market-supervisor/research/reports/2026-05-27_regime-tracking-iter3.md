# Regime Tracking — Iter 3: Transition Risk Score

date: 2026-05-27

## 예측 안정성 (D 판단 vs 실제)

| 기간 | 일치율 | N |
|---|---:|---:|
| D+ 1d | 93.4% | 3476 |
| D+ 5d | 70.3% | 3472 |
| D+10d | 54.3% | 3467 |
| D+21d | 40.1% | 3456 |

## Regime별 D+5 안정성

| regime | 일치율 | N |
|---|---:|---:|
| BEAR | 76.3% | 1226 |
| BULL | 66.8% | 743 |
| SIDEWAYS | 67.1% | 1503 |

## 전환 패턴 (D → D+5)

| D | D+5 | 횟수 | 비율 |
|---|---|---:|---:|
| BEAR | BEAR | 935 | 76.3% |
| BEAR | BULL | 22 | 1.8% |
| BEAR | SIDEWAYS | 269 | 21.9% |
| BULL | BEAR | 20 | 2.7% |
| BULL | BULL | 496 | 66.8% |
| BULL | SIDEWAYS | 227 | 30.6% |
| SIDEWAYS | BEAR | 269 | 17.9% |
| SIDEWAYS | BULL | 225 | 15.0% |
| SIDEWAYS | SIDEWAYS | 1009 | 67.1% |

## 개선사항

- Persistence 3d + 경계 보수화 (BULL 경계→SIDEWAYS, SIDEWAYS 경계→BEAR)
- D+5 안정성: iter1=69.4% → iter2=74.9% → iter3=70.3%

- Detail: `.Codex/reports/2026-05-27_regime-tracking-iter3-detail.csv`
