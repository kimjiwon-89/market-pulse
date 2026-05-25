spec: .Codex/plans/2026-05-24_mtf-candle-trend-spec.md
html: .Codex/plans/2026-05-24_mtf-candle-trend.html
status: MTF_CANDLE_TREND_IMPROVED_TARGET_FAIL
updated: 2026-05-25
goal: 월봉/주봉/일봉/분봉을 고려한 이벤트 기반 추세추종 전략 설계
latest_result: PATTERN_EXIT_V3_AVG_MONTHLY_10_19_TARGET_15_FAIL
report: .Codex/reports/2026-05-24_mtf-candle-trend-backtest.md
verdict: CANDLE_MTF_TREND_V2 V3 replaced fixed 10-day profit taking with pattern exits and non-overlap filtering; retest improved to 10.19% average monthly, but 15% average monthly remains unmet.

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
- Implementation next step: add TDD for 10-day checkpoint exit, implement in `CandleMtfTrendStrategy` or mapper candidate output, then rerun full candidate/path retest and update report.
