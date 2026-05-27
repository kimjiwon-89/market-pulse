# Regime Cadence Grid

date: 2026-05-27
policy: router_strict_sideways (BEAR/CRASH 차단, SIDEWAYS 엄격 진입)
bull_min=7, bear_min=5 (고정)
cadence_days grid: [3, 4, 5, 7, 10]

promo: pre>0%, train>=40%, worst>=-13%, win>=70%, post>=0%

## Results

| label | cadence_days | pass | pre avg | train avg | train worst | train win | train N | post avg | post N |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| cadence_5d | 5 | Y | 11.45% | 53.59% | 12.96% | 100.00% | 5 | 56.57% | 1 |
| cadence_10d | 10 | N | 8.16% | 32.21% | 12.96% | 100.00% | 3 | 56.57% | 1 |
| cadence_3d | 3 | N | 7.03% | 17.67% | -12.30% | 45.45% | 11 | -3.03% | 2 |
| cadence_4d | 4 | N | 5.37% | 16.25% | -12.30% | 50.00% | 6 | 56.57% | 1 |
| cadence_7d | 7 | N | 2.40% | 12.15% | -6.30% | 25.00% | 4 | 2.48% | 2 |

## Notes

- 현재 기본값: cadence_days=5.
- cadence 짧을수록 신호 빈도 증가, 과매매 위험.
- cadence 길수록 신호 희소, 통계적 신뢰도 하락 가능.
- train/post 일관성이 높은 cadence 값을 채택.
- Trades: `.Codex/reports/2026-05-27_regime-cadence-grid-trades.csv`
