## Next Tasks

date: 2026-05-26
status: W4_V3FIN_EARLY_FAIL_REDUCTION

### Current Result (V3-FIN)

- Rule: W4 filtered + entry confirmation 강화 + KOSPI MA60 regime + trail 20/20 + hold 30d
- pre: avg +4.24%, total +76.85%, worst -25.30%, N=32, win=34.4%
- train: avg +12.79%, total +182.84%, worst -8.30%, N=11, win=36.4%
- post: avg +41.79%, total +72.05%, worst -12.06%, N=2, win=50%
- Verdict: 3구간 양수 달성. train 목표 15% 미달. EARLY_FAIL 5/11(45%) 개선 필요.

### V3-FIN Rule (확정)

- Candidate: `range20 0.25~0.55`, `ret60 >= 0.20`, `ma60_dist > 0.05`, `close > ma20/ma60`, `vol_exp <= 3.0`, `ma20_slope5 > 0`, `ma60_slope5 > 0`, `candle_loc >= 0.45`, `upper_shadow <= 0.08`, `trade_amount >= 500M`
- Score: `range20 + ret60 + ma60_dist`, top10 fallback
- Cadence: 5 trading day, non-overlap, monthly loss stop -15%
- KOSPI regime: close > MA60
- Entry delay: 5 trading days
- Entry confirmation: drawdown >= -5%, candle_loc >= 0.65, upper_shadow <= 0.05, body_ret >= 0%
- Exit: stop -25%, early_fail -8%/3d, trail start +20% / trail 20%, max hold 30d

### Script 위치

- `D:\market-pulse\quant-model-lab\backtest_final.py` — V3-FIN 포함 최신 백테스트
- DB: localhost:5432/marketpulse, user=postgres, pass=postgreskh
- 피처: market_daily_price에서 window function으로 직접 계산

### Next Work (우선순위 순)

1. **EARLY_FAIL 감소**: train 5/11건이 -8%에 걸림. 진입 당일 이후 추가 candle 조건 탐색
   - 예: 진입 후 2일째 종가가 진입가 대비 -3% 이상이면 당일 컷
   - 또는 진입 확인 시 body_ret >= 2% (더 강한 양봉) 요구
2. **train 15% 달성**: 현재 12.79%. EARLY_FAIL 줄이거나 winner 비율 개선
3. **post 샘플 확인**: 2025-08 이후 데이터 계속 누적 중. 주기적 재실행
4. **코드 변환**: 위 안정성 확인 후 MarketDailyPriceMapper.xml + CandleMtfTrendStrategy.java에 V3-FIN 룰 반영

### Key Facts

- quant_candle_feature_snapshot 현재 비어있음. 피처는 market_daily_price에서 계산.
- KOSPI INDEX 데이터: asset_type='INDEX' 로 조회 가능
- 이전 38.51% 결과는 overfit으로 확인됨. 현재 12.79%가 현실적 기준.
