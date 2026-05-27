status: LIVE_QUANT_SIMULATION_PLANNED_NEEDS_USER_REVIEW
updated: 2026-05-27
spec: .Codex/plans/2026-05-27_live-quant-simulation-spec.md
html: .Codex/plans/2026-05-27_live-quant-simulation.html
summary: Replace the current quant backtesting-first page with a live simulated trading console for index, bull-v4, sideways, and bear models. Reports are deterministic post-close reports generated without AI/LLM. Closed trades are tracked after exit at fixed horizons to produce auditable model learning feedback.

## Previous Active Notes

status: W4_ENTRY_CONFIRMATION_NEEDS_SENSITIVITY_TEST
updated: 2026-05-26
latest_result: filtered W4 + range20 cap + entry confirmation passed train target
latest_metrics: pre avg 6.21% total 105.49% worst -26.64%; train avg 38.51% total 500.62% worst -15.68%; post avg 28.19% total 56.38% worst 25.75% but only 2 trades
latest_verdict: Not final. Train target passed, but next work must test entry delay and top fallback sensitivity before code conversion.
next_artifact: .Codex/status/next-tasks.md

spec: .Codex/plans/2026-05-24_mtf-candle-trend-spec.md
html: .Codex/plans/2026-05-24_mtf-candle-trend.html
status: MTF_PATTERN_EXIT_V4_IMPLEMENTED_NEEDS_PATH_RETEST
updated: 2026-05-26
goal: 월봉/주봉/일봉/분봉을 고려한 이벤트 기반 추세추종 전략 설계
latest_result: PATTERN_EXIT_V4_IMPLEMENTED_LOCAL_API_ZERO_TRADE_DATA
report: .Codex/reports/2026-05-24_mtf-candle-trend-backtest.md
verdict: CANDLE_MTF_TREND_V2 now includes V4 10-trading-day checkpoint exits. Local API smoke ran, but the current local DB returned zero candle trades, so performance still needs exported candidate/path retest.

## Next Work

### MTF Pattern Exit V4 Candidate
- Problem: V3 improved winners by removing fixed 10-trading-day exits, but several trades lost return because the exit waited too long or held stale losers.
- Reduced-return cases to re-check first: 이엔드디, 알에프세미, 아프리카TV, 바이오솔루션, 오픈놀, 아셈스.
- Root pattern 1: 급등 성공주는 V3가 다음날 시가 매도를 기다리며 갭하락을 맞음. Affected: 알에프세미, 바이오솔루션, 오픈놀.
- Root pattern 2: 수익권 진입 실패 종목을 40거래일까지 끌고 가 손실 확대. Affected: 아셈스.
- Candidate rule A: 10거래일 체크포인트에서 수익률이 +20% 이상이면 익절한다.
- Candidate rule B: 10거래일 체크포인트 근처에서 종가가 20일선 아래이고 ret20이 음전이면 다음 거래일 컷한다.
- Candidate rule C: 그 외 정상 추세는 기존 V3처럼 최대 40거래일 보유하면서 패턴 익절한다.
- Rough retest estimate: V3 10.19% avg monthly / 486.94% total -> V4 candidate 12.31% avg monthly / 845.29% total / worst month -9.32%.
- Implemented 2026-05-26: mapper SQL now preserves confirm-low first, then applies checkpoint +20% exit, checkpoint MA20/ret20 rollover exit, and finally the V3 pattern/max-hold exits.
- Verification: `CandleTrendStrategyTest`, XML well-formed parse, backend compile, and local API smoke all completed. API smoke returned 0 trades for the current local DB, including `CANDLE_MOMENTUM_H20_V1`, so it is not a valid performance retest dataset.
- Next step: rerun the exported candidate/path retest dataset used for V3 and update this plan/report with real V4 metrics.
