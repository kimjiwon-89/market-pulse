# MP_CORE 백테스트 업그레이드 테스트 보고서

작성일: 2026-05-21 21:24 KST  
대상: MP_CORE 2% 수익률 원인 진단, 백테스트 경로 수정, 월 5% 단계 목표 검증 준비

## 1. 결론

이번 테스트에서 확인한 핵심은 "현재 약 2% 수익률"이 MP_CORE 모델 자체의 정확한 성과로 보기 어렵다는 점이다.

기존 `/quant` 백테스트는 `strategyId: 1` 일반 전략을 실행하고 있었고, 대시보드의 latest backtest는 최신 `quant_backtest_result`를 MP_CORE evidence처럼 읽었다. 따라서 기존 2%는 MP_CORE signal portfolio 성능이 아니라 일반 전략 결과가 섞였을 가능성이 높다.

이번 업그레이드로 아래를 수정했다.

- `MP_CORE_SIGNAL` 전략 추가
- `/api/quant/core/backtests`가 `MP_CORE_SIGNAL`만 실행하도록 변경
- `/api/quant/core/backtests/latest`가 `MP_CORE_SIGNAL` 결과만 조회하도록 변경
- 월수익률 계산을 단순 나눗셈에서 복리 월환산으로 변경
- 프론트의 hard-coded `strategyId: 1` 제거
- 단계 목표 월수익률을 5%로 표시

과거 가격 데이터 수집 후 1개 리밸런싱 구간 기준 MP_CORE 전용 수익률을 산출했다. 다만 표본이 1개월뿐이라 성능 판정용으로는 부족하다.

## 2. 실제 테스트 결과

### 빌드/컴파일

| 항목 | 명령 | 결과 |
|---|---|---|
| 백엔드 컴파일 | `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile` | PASS |
| 프론트 빌드 | `npm run build` | PASS |
| Spring Boot 실행 | `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=18080` | PASS |
| API health | `GET /actuator/health` | `UP` |

### DB 상태

테스트 시작 시점:

| 테이블 | 건수 |
|---|---:|
| `market_daily_price` | 0 |
| `quant_core_feature_snapshot` | 0 |
| `quant_core_signal` | 0 |
| `quant_backtest_result` | 0 |
| `quant_trade_log` | 0 |

KRX STOCK 수집 실행:

```text
POST /api/quant/collect?from=20250102&to=20250630&dataType=STOCK
```

보고서 작성 시점 상태:

| 항목 | 값 |
|---|---:|
| 수집 상태 | DONE |
| processedDates | 180 / 180 |
| latestDate | 20250630 |
| DB 적재 거래일 | 118 |
| DB 적재 범위 | 2025-01-02 ~ 2025-06-30 |
| STOCK row 수 | 325,088 |

### Feature / Backtest API 결과

현재 118거래일치 데이터로 feature는 생성됐지만, 20영업일 forward label 때문에 실제 백테스트 가능한 리밸런싱 구간은 2025년 5월 1개월뿐이다.

실행:

```text
POST /api/quant/core/features?from=20250102&to=20250630
```

결과:

```json
{
  "modelCode": "MP_CORE",
  "from": "2025-01-02",
  "to": "2025-06-30",
  "generatedCount": 158518
}
```

실행:

```text
POST /api/quant/core/backtests
body: { "from": "20250102", "to": "20250630", "initialCash": 10000000 }
```

결과:

```json
{
  "modelCode": "MP_CORE",
  "monthlyReturn": 0.016949,
  "equityCurve": [{ "date": "20250530", "value": 11038885, "returnPct": 0.103889 }],
  "monthlyReturns": [{ "year": 2025, "month": 5, "returnPct": 0 }],
  "costSummary": {
    "tradeCount": 40
  }
}
```

판정: API는 정상 응답했고 MP_CORE 전용 백테스트가 실행됐다. 총수익률은 10.3889%, 기간 기준 복리 월환산 수익률은 1.6949%다. 단, 실제 매매 구간은 2025년 5월 1개월뿐이라 신뢰도는 낮다.

## 3. 업그레이드한 정보

### 백엔드

| 변경 | 파일 |
|---|---|
| MP_CORE 전용 전략 추가 | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/MpCoreSignalStrategy.java` |
| MP_CORE feature-score 월별 후보 SQL 추가 | `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml` |
| core backtest가 MP_CORE 전략만 실행 | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantBacktestService.java` |
| latest backtest가 MP_CORE 전략만 조회 | `market-pulse-api/src/main/resources/mapper/quant/QuantCoreDashboardMapper.xml` |
| 월수익률 복리 월환산 | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java` |
| 목표 월수익률 5% 표시 | `market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/mp_core/MpCoreModelDefinition.java` |

### 프론트엔드

| 변경 | 파일 |
|---|---|
| core backtest request에서 `strategyId: 1` 제거 | `market-pulse-web/src/pages/QuantDashboard/RunControlPanel.tsx` |

## 4. 수익률 개선 여부

현재는 "정확한 개선 폭"이 아니라 "정합성 수정 후 재측정값"까지만 계산할 수 있다.

이유:

1. 로컬 DB의 `market_daily_price`가 비어 있었고, 테스트 중 새로 수집을 시작했다.
2. 보고서 작성 시점에는 118거래일이 적재됐다.
3. MP_CORE feature는 생성됐지만, 말월 feature의 forward label 생성을 위해 추가 미래 가격 buffer가 필요하다.
4. 현재 백테스트는 2025년 5월 1개 리밸런싱 구간만 포함했다.

따라서 현재 수익률 비교는 아래처럼 기록한다.

| 구분 | 값 | 판정 |
|---|---:|---|
| 기존 표시 수익률 | 약 2% | 일반 전략 결과가 섞였을 가능성이 높아 MP_CORE 기준 성과로 부적합 |
| 업그레이드 후 실제 MP_CORE 수익률 | 월환산 1.6949% | 2025-01-02~2025-06-30 기간, 실제 매매 2025년 5월 1개월 |
| 개선 폭 | 직접 비교 불가 | 기존 2%는 generic 전략 혼입 가능성이 높아 동일 기준 비교 불가 |

## 5. 2%가 나온 원인

가장 유력한 원인:

- `/quant` backtest 실행이 `strategyId: 1`을 고정 사용했다.
- `strategyId: 1`은 MP_CORE가 아니라 `MA_CROSSOVER`다.
- latest backtest 조회가 전략을 구분하지 않고 최신 결과를 읽었다.
- core dashboard의 monthly return 계산이 일반 backtest의 복리 월환산과 달랐다.

즉, 2%는 "MP_CORE 모델이 2%밖에 못 냈다"가 아니라 "MP_CORE 대시보드가 MP_CORE가 아닌 결과를 표시했을 가능성"이 더 크다.

## 6. 더 개선할 방향

### 1단계: 데이터 파이프라인 안정화

- KRX 수집 속도 개선
- 거래일만 수집하도록 holiday/weekend skip
- 장기 수집은 백그라운드 상태뿐 아니라 날짜별 실패 로그 저장
- feature 생성 전 최소 필요 거래일 검증 메시지 추가

### 2단계: MP_CORE 수익률 재측정

- 최소 6개월, 권장 1년 이상 STOCK 데이터 수집
- `POST /api/quant/core/features`
- `POST /api/quant/core/backtests`
- 결과에서 월환산 수익률, MDD, 거래 비용, 월별 승률 확인

### 3단계: 월 5% 목표 튜닝

- WINNER label을 20영업일 5% 기준으로 조정
- risk-adjusted momentum, 20일 momentum, 유동성, drawdown, volatility 안정성 가중치 grid search
- topN, max single weight, 현금 비중 규칙 튜닝
- 과열 추격매수 차단 조건 추가

### 4단계: 월 15%+ 장기 목표

15%+는 현재 가격 데이터만으로 바로 밀어붙이면 과최적화 가능성이 크다. 아래 데이터가 붙은 뒤 별도 단계로 진행한다.

- 외국인/기관 일별 수급
- 공매도 거래대금/잔고
- 대차잔고
- KOSPI200 선물, basis, 미결제약정
- 시간외/장외 대량거래

## 7. 다음 실행 명령

수집 완료 확인:

```bash
curl -sS "http://127.0.0.1:18080/api/quant/collect/status" -H "Authorization: Bearer <TOKEN>"
```

DB 적재 확인:

```bash
psql -d marketpulse -Atc "select count(*), min(trade_date), max(trade_date), count(distinct trade_date) from market_daily_price where asset_type='STOCK';"
```

feature 생성:

```bash
curl -X POST "http://127.0.0.1:18080/api/quant/core/features?from=20250102&to=20250630" -H "Authorization: Bearer <TOKEN>"
```

backtest 실행:

```bash
curl -X POST "http://127.0.0.1:18080/api/quant/core/backtests" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"from":"20250102","to":"20250630","initialCash":10000000}'
```

## 8. 작업 기록

- MP_CORE 백테스트 경로 수정 완료
- 로컬 API 18080 포트 실행
- KRX STOCK 수집 시작
- 하루치 수집 성공 확인
- 2025-01-02 ~ 2025-06-30 STOCK 데이터 수집 완료
- MP_CORE feature 158,518건 생성 및 backtest 실행
- 백엔드/프론트 빌드 검증 완료
