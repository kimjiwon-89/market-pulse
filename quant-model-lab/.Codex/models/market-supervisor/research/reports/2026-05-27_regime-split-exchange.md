# KOSPI/KOSDAQ 분리 레짐 백테스트

date: 2026-05-27

정책:
  baseline    : 기존 통합 레짐 (BEAR/CRASH 차단, SIDEWAYS 엄격)
  split       : 거래소별 레짐 (KOSPI 종목→KOSPI 레짐, KOSDAQ 종목→KOSDAQ 레짐)
  split_strict: 거래소별 레짐 + BULL일 때만 진입 허용

## Results

| policy | pass | pre avg | train avg | train worst | train win | train N | post avg | post N |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| baseline | Y | 11.45% | 53.59% | 12.96% | 100.00% | 5 | 35.81% | 2 |
| split_strict | Y | 4.48% | 50.11% | 12.96% | 100.00% | 4 | 35.81% | 2 |
| split | N | 12.68% | 37.63% | -12.30% | 80.00% | 5 | 35.81% | 2 |

## 거래소별 성과 (train, split 정책)

| exchange | avg ret | N | win |
|---|---:|---:|---:|
| KOSPI | 37.80% | 3 | 66.67% |
| KOSDAQ | 37.36% | 2 | 100.00% |

## Notes

- split이 baseline보다 좋으면: 거래소 분리 판단이 유효.
- KOSDAQ 성과가 나쁘면: KOSDAQ 레짐 임계값 조정 검토.
- Trades: `.Codex/reports/2026-05-27_regime-split-exchange-trades.csv`
