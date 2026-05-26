## Next Tasks

date: 2026-05-26
status: W4_ALLSEASON_DIRECTION_CHANGE

## 방향 요약

W4 전략을 호황장 전용(both_ma20)에서 전 국면 대응으로 전환 중.
현재 best: `adaptive` 변형 — KOSPI MA60 최소 + 국면별 출구.

## 당장 할 수 있는 작업

### 1. adaptive 변형 백엔드 반영
파일: `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`

변경 사항:
- 시장 필터: `KOSPI > MA20 AND KOSDAQ > MA20` → `KOSPI > MA60`
- 출구: 국면 감지 컬럼 추가 후 Java 서비스에서 분기 처리
  - bull  (both_ma20): max 60일, conditional extension
  - mixed (kospi_ma60): max 35일
  - bear  (kospi<=ma60): max 20일, stop -10%, ef -5%

대상 전략 클래스: `CandleMtfTrendNbStrategy.java`

### 2. W4_RECOVER 신호 설계 및 테스트
새 파이썬 스크립트: `backtest_w4_recover.py`

신호 조건 (초안):
- `ret60 between -0.30 and 0.0`
- `close > ma60` (장기 추세 살아있음)
- `ret20 > 0` (반등 시작)
- `vol_exp >= 1.5` (수요 복귀 조짐)
- `candle_loc >= 0.50`, `upper_shadow <= 0.10`
- `trade_amount >= 500M`

출구 (초안):
- max 20일, stop -8%, early_fail -4%/3d, trail after +15% trail 15%
- 모든 국면 동일 (recover 신호는 자체적으로 빡빡한 exit)

목표: pre/train/post 모두 양수, bear 국면 승률 >= 50%

## 현재 최선 후보 지표

`adaptive` (KOSPI_MA60 + regime-adaptive exits):
- pre  2012-2022: avg +8.29%, total +534%, worst -12.60%, 31건, win 48%
- train 2022-2025: avg +28.70%, total +595%, worst -12.30%, 10건, win 60%
- post  2025-2026: avg +5.35%, total +14.73%, worst -6.30%, 3건, win 67%

국면별 (full period):
- bull:  avg ~9~33% (구간별), win 50~83%
- mixed: avg ~2~23%, win 25~43%  ← 개선 여지
- bear:  avg -3.18% (pre 15건, 20% win) ← W4_RECOVER로 보완 필요

## 핵심 인사이트 (잊지 말 것)

1. W4 breakout 신호는 bear 국면에서 20% 승률 → 시장 필터 제거만으로는 해결 안 됨
2. Post 양전의 핵심: KOSPI MA60 기준으로 느슨하게 풀면 3번째 post 거래(+) 포착
3. 해당 3번째 거래는 "KOSPI 장기불장 + 단기 눌림목" 구간 — momentum 필터가 이 거래를 제거함
4. KOSDAQ slope 필터(bma20+Qslope)는 train 53%로 올리지만 post 여전히 음수 → train 극대화 vs post 안정성 trade-off 존재
5. 연도별: 2022년 0건, 2024년 train -1.70% → sparse signal 문제 구조적

## 아티팩트

| 파일 | 내용 |
|---|---|
| `backtest_w4_allseason.py` | 전 국면 adaptive 테스트 (최신) |
| `backtest_w4_regime_filter.py` | regime + momentum 필터 조합 |
| `backtest_w4_post_fix.py` | post -2.90% 원인 분석 |
| `backtest_v3fin_exit_grid.py` | exit grid (46% 근거) |
| `.Codex/reports/2026-05-26_w4-allseason.md` | all-season 결과 |
| `.Codex/reports/2026-05-26_w4-regime-filter.md` | regime filter 결과 |
| `.Codex/status/active-plan.md` | 현재 계획 전체 |
