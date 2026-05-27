status: W4_DIRECTION_CHANGE_ALLSEASON
updated: 2026-05-26
workspace_root: D:\market-pulse\quant-model-lab

## 방향 전환 배경

기존 W4 전략은 both_ma20(KOSPI+KOSDAQ > MA20) 호황장 전용이었음.
- 연평균 신호 약 2건, 불황장 신호 없음
- post(2025-08~2026-05) 2건 모두 -2.90% → 검증 미통과
- bear regime 실증: 20% 승률, -3.18% avg monthly → W4 breakout 신호는 불황장 작동 안 함

## 현재 최선 후보: adaptive 변형

```text
W4-ADAPTIVE (KOSPI_MA60 + regime-adaptive exits)
```

| 구간 | avg monthly | N | win | worst |
|---|---:|---:|---:|---:|
| pre 2012-2022 | +8.29% | 31 | 48.4% | -12.60% |
| train 2022-2025 | +28.70% | 10 | 60.0% | -12.30% |
| post 2025-2026 | +5.35% | 3 | 66.7% | -6.30% |

모든 구간 양수, post 양전. 기존 46% → 29%로 하락했지만 전 구간 안정성 확보.

## 규칙

### 신호 (W4 변경 없음)
- `range20 0.25~0.55`, `ret60 >= 0.20`
- stock > MA20, MA60, slope 양수
- `candle_loc >= 0.45`, `upper_shadow <= 0.08`
- `trade_amount >= 500M`

### 시장 필터
- KOSPI > MA60 (최소 기준 — KOSDAQ 제약 제거)
- bull/mixed/bear 국면 자동 감지

### 진입 확인
- 5거래일 딜레이
- drawdown >= -5%, candle_loc >= 0.65, upper_shadow <= 0.08
- body_ret >= 0%, MA20 거리 >= 5%, 다음날 body_ret >= 1%

### 국면별 출구
- bull  (KOSPI+KOSDAQ > MA20): 최대 60일, 조건부 연장(day30 >= +25%, 위 MA20), extension trail 20%, stop -12%, ef -6%
- mixed (KOSPI > MA60): 최대 35일, 연장 없음, stop -12%, ef -6%
- bear  (KOSPI <= MA60): 최대 20일, 연장 없음, stop -10%, ef -5%

## 국면별 성과 실증

| 국면 | avg monthly | N(pre) | win(pre) |
|---|---:|---:|---:|
| bull | +9.77% | 24 | 50.0% |
| mixed | +2.04% | 7 | 42.9% |
| bear | **-3.18%** | **15** | **20.0%** |

→ bear 국면에서 W4 breakout 신호 자체가 작동 안 함. 다른 신호 필요.

## 다음 단계

### Phase 1 (단기)
- adaptive 변형으로 백엔드 SQL 업데이트
- 시장 필터: both_ma20 → KOSPI_ma60
- 출구: 국면별 파라미터 적용

### Phase 2 (중기) — W4_RECOVER 신호 설계
- 목표: 혼조/하락장 보완 신호
- 조건 후보:
  - `ret60 between -0.30 and 0.0` (빠진 종목)
  - `close > ma60` (장기 추세 살아있음)
  - `ret20 > 0` (최근 반등 시작)
  - `vol_exp >= 1.5` (수요 복귀)
- 출구: max 20일, stop -8%, trail after +15%

### Phase 3 (장기)
- W4 + W4_RECOVER 두 신호 포트폴리오 통합
- 전 시장 국면 대응

## 주요 아티팩트

- All-season 결과: `.Codex/reports/2026-05-26_w4-allseason.md`
- Post-fix 결과: `.Codex/reports/2026-05-26_w4-post-fix.md`
- Regime filter 결과: `.Codex/reports/2026-05-26_w4-regime-filter.md`
- 스크립트: `backtest_w4_allseason.py`, `backtest_w4_post_fix.py`, `backtest_w4_regime_filter.py`
