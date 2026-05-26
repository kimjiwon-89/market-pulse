status: W4_V3FIN_EARLY_FAIL_REDUCTION
updated: 2026-05-26
workspace_root: D:\market-pulse\quant-model-lab

## Scope

- Quant work root is `D:\market-pulse\quant-model-lab`.
- Plans, reports, logs, CSV outputs, and status files stay under this folder's `.Codex/`.

## Latest Result (V3-FIN)

Rule family: W4 filtered + range cap + entry confirmation 강화 + KOSPI regime + trail 20/20 + hold 30d

| period | avg monthly | total | worst | N | win rate |
|--------|-------------|-------|-------|---|----------|
| pre (2015-2022-04) | +4.24% | +76.85% | -25.30% | 32 | 34.4% |
| train (2022-05~2025-07) | +12.79% | +182.84% | -8.30% | 11 | 36.4% |
| post (2025-08~2026-05) | +41.79% | +72.05% | -12.06% | 2 | 50.0% |

Verdict: 3구간 모두 양수 달성. train 목표 15% 미달(12.79%). EARLY_FAIL 5/11건 개선 여지.

## V3-FIN Rule

- Candidate filter: `range20 >= 0.25 AND <= 0.55`, `ret60 >= 0.20`, `ma60_dist > 0.05`, `close > ma20 AND ma60`, `vol_exp <= 3.0`, `ma20_slope5 > 0`, `ma60_slope5 > 0`, `candle_loc >= 0.45`, `upper_shadow <= 0.08`, `trade_amount >= 500M`
- Score: `range20 + ret60 + ma60_dist`
- Cadence: every 5 trading days, non-overlap
- Entry delay: 5 trading days after signal
- Entry confirmation: `drawdown >= -5%`, `candle_loc >= 0.65`, `upper_shadow <= 0.05`, `body_ret >= 0%`, top10 fallback
- KOSPI regime: `KOSPI close > KOSPI MA60`
- Exit: stop -25%, early_fail -8%/3d, trail after +20% open profit with 20% trail, max hold 30d, monthly loss stop -15%

## Key Finding (2026-05-26)

- 이전 38.51% train avg는 소샘플(13건) + overfit 확인. 확장 기간 재테스트에서 재현 불가.
- quant_candle_feature_snapshot 비어있음. 모든 피처는 market_daily_price window function으로 계산.
- KOSPI regime + 빠른 trail(20/20) + hold 30d 조합이 3구간 모두 양수로 전환시킨 핵심 변경.

## Next Work

- EARLY_FAIL 감소: train 5/11건(45%) → 추가 진입 필터 탐색
- train avg 12.79% → 15% 달성 시도
- post 샘플 확장 확인 (현재 2건)
- 안정성 충분히 확인 후 mapper/service 코드 변환

## Artifacts

- Report: `.Codex/reports/2026-05-26_w4-final-sensitivity.md`
- Sensitivity: `.Codex/reports/2026-05-26_w4-extended-sensitivity.md`
- Log: `.Codex/.logs/2026-05-26-log.md`
- Scripts: `backtest_w4_sensitivity.py`, `backtest_w4_v2.py`, `backtest_final.py`, `analyze_v3.py`
