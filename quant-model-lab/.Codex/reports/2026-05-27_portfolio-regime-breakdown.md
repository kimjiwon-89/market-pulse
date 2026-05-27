# Portfolio Regime Breakdown

date: 2026-05-27
capital: 1,000,000,000  position: 100,000,000  max_pos: 10

## Regime Distribution

| period | BULL | SIDEWAYS | BEAR | CRASH | total |
|---|---:|---:|---:|---:|---:|
| pre | 144 | 59 | 13 | 0 | 216 |
| train | 40 | 10 | 1 | 0 | 51 |
| post | 32 | 4 | 0 | 0 | 36 |

## Per-Regime Performance (전 기간)

| regime | period | N | win | avg ret | worst month |
|---|---|---:|---:|---:|---:|
| BULL | pre | 144 | 36.81% | 0.84% | -4.35% |
| BULL | train | 40 | 35.00% | 2.77% | -2.49% |
| BULL | post | 32 | 53.12% | 5.07% | -3.21% |
| SIDEWAYS | pre | 59 | 40.68% | 0.68% | -2.68% |
| SIDEWAYS | train | 10 | 50.00% | 0.89% | -1.23% |
| SIDEWAYS | post | 4 | 50.00% | 4.47% | -0.63% |
| BEAR | pre | 13 | 38.46% | 0.23% | -1.55% |
| BEAR | train | 1 | 0.00% | -1.23% | -1.23% |

## Policy Comparison

baseline: train avg 53.59%, worst +12.96%, win 100%, N=5 (단일포지션)

| policy | period | N | win | avg(monthly) | worst |
|---|---|---:|---:|---:|---:|
| all | pre | 216 | 37.96% | 0.93% | -5.16% |
| all | train | 51 | 37.25% | 2.41% | -2.49% |
| all | post | 36 | 52.78% | 6.00% | -3.21% |
| bull_sideways | pre | 203 | 37.93% | 0.96% | -5.16% |
| bull_sideways | train | 50 | 38.00% | 2.58% | -2.49% |
| bull_sideways | post | 36 | 52.78% | 6.00% | -3.21% |
| bull_only | pre | 144 | 36.81% | 0.84% | -4.35% |
| bull_only | train | 40 | 35.00% | 2.77% | -2.49% |
| bull_only | post | 32 | 53.12% | 5.07% | -3.21% |
| excl_bear | pre | 203 | 37.93% | 0.96% | -5.16% |
| excl_bear | train | 50 | 38.00% | 2.58% | -2.49% |
| excl_bear | post | 36 | 52.78% | 6.00% | -3.21% |

## Notes

- 포트폴리오 모드: 동시 최대 10 포지션, 릴렉스 진입
- 레짐 라벨: 신호일 기준 (미래 수익률 불사용)
- avg(monthly): 월별 포트폴리오 수익 / 총 자본
- Trades: `.Codex/reports/2026-05-27_portfolio-regime-breakdown-trades.csv`
