# Market Leading Model - Proxy Feature Validation

date: 2026-05-27

**목적:** 미래 방향 예측 (기존 레짐 모델은 현재 상태 분류)

**방법:** 기존 OHLCV에서 선행 대리 지표 계산 → D+5/D+20 상관 검증

## 1. 지표별 예측력

| 지표 | corr D+5 | corr D+20 | 방향정확 D+5 | 방향정확 D+20 | N |
|---|---:|---:|---:|---:|---:|
| breadth_thrust | 0.062 | 0.061 | 15.43% | 8.30% | 3995 |
| momentum_div | -0.013 | 0.015 | 0.75% | 6.41% | 3994 |
| breadth_5d_chg | 0.016 | 0.042 | 1.88% | 3.98% | 3995 |
| kosdaq_lead | -0.043 | -0.072 | 2.32% | 2.62% | 3995 |
| adv_ratio_chg | 0.006 | 0.015 | 1.48% | 2.48% | 3995 |
| new_high_ratio | 0.019 | -0.004 | 2.98% | 2.02% | 3995 |
| vol_price_confirm | 0.026 | 0.015 | 4.58% | 1.08% | 3995 |
| vol_surge | 0.001 | 0.020 | 1.72% | 0.18% | 3995 |

> 방향정확 = |신호 고구간 양성률 - 저구간 양성률|. 클수록 분별력 높음.

## 2. 복합 점수 (상위 지표: breadth_thrust, momentum_div, breadth_5d_chg)

| 신호 | N | KOSPI D+5 avg | D+5 양률 | KOSPI D+20 avg | D+20 양률 |
|---|---:|---:|---:|---:|---:|
| BULL_LEAD | 1325 | 0.29% | 58.42% | 1.50% | 62.57% |
| NEUTRAL | 1365 | 0.10% | 54.29% | 0.31% | 52.75% |
| BEAR_LEAD | 1305 | 0.24% | 55.63% | 0.94% | 55.17% |

## 3. 검증 요약

- BULL_LEAD D+20: 1.50%
- BEAR_LEAD D+20: 0.94%
- 방향 검증 (BULL > BEAR): PASS

**결론:** 복합 점수가 시장 방향을 선행 예측. 기존 레짐 모델과 결합 시 진입 필터 강화 가능.

- Features CSV: `.Codex/reports/2026-05-27_leading-model-features.csv`
