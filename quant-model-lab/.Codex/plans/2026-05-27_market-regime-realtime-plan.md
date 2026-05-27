# Market Regime Model — Realtime 전환 계획

date: 2026-05-27
status: PLANNED_NOT_STARTED
prerequisite: 백엔드 quant_market_regime_snapshot 테이블 구현 완료 후 진행

---

## 현재 상태

`compute_realtime_regime.py`는 **장 마감 후 하루 1회** 실행 기준으로 설계됨.

- DB에서 최근 70일치 데이터 로드
- SQL 윈도우 함수로 MA/vol/breadth 계산
- `market_regime_model.classify_regime()` 호출
- `quant_market_regime_snapshot` 테이블에 저장

성능: 0.57초, 4MB RAM — AWS Free Tier(t2.micro) 완전 호환.

---

## 실시간 전환 목표

장중 KOSPI/KOSDAQ 현재가를 KIS API로 수신해서
매 N분마다 국면을 재판정하고 V4 전략에 전달.

---

## 핵심 설계 원칙

지표를 **느린 지표**와 **빠른 지표** 두 종류로 분리한다.

### 느린 지표 — 하루 1번 갱신 (장 시작 시 캐싱)

```
MA20, MA60          (어제 종가 기준, 오늘 중에 안 바뀜)
ma20_slope5         (MA20 5일 기울기)
vol20               (20일 일간 수익률 표준편차)
breadth_ma20        (전체 종목 중 MA20 위 비율)
breadth_ma60
advance_ratio_5d
liquidity_trend
```

### 빠른 지표 — 실시간 (매 틱/N분마다)

```
KOSPI 현재가
KOSDAQ 현재가
```

`features_from_index_levels()`는 이미 이 두 종류를 인자로 분리해서 받음.
실시간 전환 시 이 함수 시그니처는 변경 불필요.

---

## 추가할 컴포넌트

### 1. `load_cached_ma_features(conn, target_date)` 함수 추가

장 시작(09:00) 때 한 번만 호출.
DB에서 전일 기준 MA/slope/vol/breadth를 로드해서 dict로 반환.
결과를 메모리(또는 Redis)에 캐싱.

```python
cached = load_cached_ma_features(conn, date.today())
# cached = {
#   "kospi_ma20": 2450.3, "kospi_ma60": 2380.1, "kospi_ma20_slope_5d": 0.008,
#   "kospi_vol20": 0.015, "kosdaq_ma20": ..., ...
#   "breadth_ma20": 0.62, "breadth_ma60": 0.55,
#   "advance_ratio_5d": 0.57, "liquidity_trend": 0.03,
# }
```

### 2. `classify_with_live_price(live_kospi, live_kosdaq, cached)` 함수 추가

매 틱 또는 N분마다 호출. DB 접근 없음. 순수 계산만.

```python
def classify_with_live_price(live_kospi, live_kosdaq, cached):
    features = features_from_index_levels(
        kospi_close=live_kospi,
        kospi_ma20=cached["kospi_ma20"],
        kospi_ma60=cached["kospi_ma60"],
        kospi_ma20_slope_5d=cached["kospi_ma20_slope_5d"],
        kospi_vol20=cached["kospi_vol20"],
        kosdaq_close=live_kosdaq,
        ...
        breadth_ma20=cached["breadth_ma20"],
        ...
    )
    return compute_snapshot(features, trade_date=date.today())
```

### 3. KIS WebSocket 또는 폴링 연결

KIS 실시간 시세 API로 KOSPI/KOSDAQ 현재가 수신.
WebSocket 권장 (폴링은 rate limit 위험).

수신할 종목 코드:
- KOSPI 지수: `0001` (KIS 기준 코드 확인 필요)
- KOSDAQ 지수: `1001` (KIS 기준 코드 확인 필요)

---

## 실행 흐름 (전환 후)

```
09:00 장 시작 전
  └─ load_cached_ma_features() → 메모리 캐싱

09:00~15:30 장중 (매 1분 또는 5분)
  └─ KIS API → live_kospi, live_kosdaq 수신
  └─ classify_with_live_price(live_kospi, live_kosdaq, cached)
  └─ 국면 변경 감지 시 → V4 전략에 즉시 전달

15:30 장 마감 후
  └─ compute_realtime_regime.py --save (기존 방식)
  └─ quant_market_regime_snapshot 테이블 최종 저장
```

---

## V4 전략 연동 방식

V4가 신호 생성 시 현재 국면을 읽어서 진입 여부 결정.

```
BULL     → 정상 진입 (router_strict_sideways 기준)
SIDEWAYS → entry_ma20_min=8%, entry_next_body_min=2% 조건 강화 후 진입
BEAR     → 진입 차단
CRASH    → 전량 현금, 신규 진입 없음
```

라우터 정책 근거: `.Codex/reports/2026-05-27_w4-v3fin-regime-router.md` 참고.
`router_strict_sideways`가 train avg 53.59%, worst +12.96%, win 100% 달성.

---

## 구현 순서 (이 작업 시작할 때)

1. `compute_realtime_regime.py`에 `load_cached_ma_features()` 함수 추가
2. `market_regime_model.py`에 `classify_with_live_price()` 함수 추가
3. KIS WebSocket으로 KOSPI/KOSDAQ 지수 현재가 수신 테스트
4. 장중 루프 구현 (국면 변경 시 로그/알림)
5. V4 전략 코드에 regime 체크 로직 연결
6. `quant_market_regime_snapshot` 테이블 장중 중간 저장 여부 결정

## 주의사항

- 백테스트와 실시간의 breadth_ma20 계산 방식이 달라지면 안 됨.
  느린 지표 캐시는 반드시 전일 종가 기준으로 고정할 것.
- look-ahead bias 금지: 당일 breadth는 장 마감 후에만 확정.
  장중 breadth 대신 전일 breadth를 그대로 사용.
- KIS WebSocket 연결 끊김 시 fallback: 마지막 유효 국면 유지.
