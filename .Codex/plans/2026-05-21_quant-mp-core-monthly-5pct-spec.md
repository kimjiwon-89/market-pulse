## 기능명

MP_CORE 월 5% 목표 모델 업데이트

### 상태

- status: IMPLEMENTED
- 작성일: 2026-05-21
- 배경: 사용자가 MP_CORE 방향성을 다시 잡고 월 5% 목표까지 모델 성능을 올리는 방향을 요청했다.
- 주의: 월 5%는 수익 보장이 아니라 모델 라벨링, 후보 선별, 백테스트 검증 기준이다.
- 2026-05-21 재정의: 먼저 현재 약 2% 수익률이 나온 원인을 제거하고, 이후 5%, 최종 15%+ 순서로 단계적 개선한다.

### 2% 수익률 원인 진단

현재 확인한 가장 큰 문제는 "MP_CORE 모델 성능이 2%"라고 보기 어렵다는 점이다. 현재 `/quant` 화면의 백테스트 경로는 MP_CORE signal portfolio를 검증하지 않고, `strategyId` 기반 일반 전략 백테스트를 최신 결과로 읽는다.

원인 후보:

1. `RunControlPanel`의 Backtest 실행은 `/quant/core/backtests`를 호출하지만 body에 `strategyId: 1`을 고정한다.
2. `strategyId: 1`은 초기 전략 목록 기준 `MA_CROSSOVER`일 가능성이 높고, 이 전략은 KOSPI index 단일 buy/hold 성격에 가깝다.
3. `QuantCoreDashboardService.getLatestBacktest()`는 `quant_backtest_result`의 최신 기간을 읽을 뿐, MP_CORE signal로 만든 결과인지 확인하지 않는다.
4. 월수익률 계산은 equity curve의 누적수익률을 `equity.size() / 21`로 나누는 단순 근사다. 일반 백테스트의 CAGR 기반 monthly return과 계산 방식이 다르다.
5. MP_CORE signal은 생성되어도 실제 포트폴리오 백테스트 엔진에 연결되어 있지 않다.

따라서 개선 순서는 아래로 바꾼다.

1. MP_CORE 전용 signal backtest 경로를 만든다.
2. `/quant/core/backtests/latest`는 MP_CORE 전용 결과만 읽게 한다.
3. 월수익률 계산식을 일반 백테스트와 같은 복리 월환산 방식으로 맞춘다.
4. 그 다음 feature/score/threshold를 조정해 월 5%를 검증한다.
5. 최종 15%+ 목표는 수급, 공매도, 선물, 장외거래 데이터가 붙은 뒤 별도 단계로 둔다.

### 현재 관찰

- `MpCoreModelDefinition`에는 `targetMonthlyReturn = 0.15`가 있으나 실제 signal 생성 SQL은 이 값을 사용하지 않는다.
- 현재 feature snapshot은 가격/유동성/변동성 중심이다.
  - `ret5d`, `ret20d`, `ret60d`, `ret120d`, `ret252d`
  - `vol60d`, `drawdown60d`, `tradeAmount20dAvg`, `riskAdjRet60d`
- 현재 WINNER 라벨은 20영업일 forward return 8% 이상이다.
- 현재 baseline score는 `risk_adj_rank`, `ret_rank`, `liquidity_rank`, `drawdown_score`로 계산한다.
- 선물/공매도/장외 데이터는 아직 DB feature에 없으므로 이번 구현에서 가짜 feature로 넣지 않는다.

### 범위

#### 백엔드

- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/mp_core/MpCoreModelDefinition.java`
- `market-pulse-api/src/main/resources/mapper/quant/QuantCoreFeatureSnapshotMapper.xml`
- `market-pulse-api/src/main/resources/mapper/quant/QuantCoreSignalMapper.xml`
- 필요 시:
  - `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantCoreDashboardService.java`
  - quant DTO는 기존 응답 구조가 깨지는 경우에만 수정

#### 프론트엔드

- 원칙적으로 변경 없음
- 기존 `reason`, `riskFlags`, `score`, `winnerProb` 표시가 깨지는 경우에만 문구 보완

#### 문서

- `.claude/quant/12-퀀트-전략을-이용한-종목선정-기본.md`
- `.Codex/.logs/2026-05-21-log.md`

### 목표 변경

| 항목 | 현재 | 변경안 |
|---|---:|---:|
| targetMonthlyReturn | 0.15 | 0.05 |
| winnerReturnThreshold | 0.08 | 0.05 |
| winnerExcessThreshold | 0.03 | 0.02 |
| loserReturnThreshold | -0.05 | -0.035 |
| winnerProbThreshold | 0.55 | 0.58 |

이 표는 2차 단계 후보이며, 1차 구현에서는 먼저 백테스트 경로와 수익률 계산 정합성을 고친다.

### Feature 라벨링

`QuantCoreFeatureSnapshotMapper.xml`의 label 기준을 조정한다.

```sql
CASE
  WHEN forward_return >= 0.05 THEN 'WINNER'
  WHEN forward_return <= -0.035 THEN 'LOSER'
  WHEN forward_return IS NULL THEN NULL
  ELSE 'NEUTRAL'
END
```

`preprocessing_meta`에는 목표 기준과 엔진 버전을 남긴다.

```json
{
  "source": "market_daily_price",
  "preprocessing": "raw rolling features; monthly 5pct baseline",
  "lookAheadSafe": true,
  "targetMonthlyReturn": 0.05,
  "labelHorizonDays": 20,
  "labelVersion": "mp_core_monthly_5pct_v1"
}
```

### Signal scoring

현재 데이터만 사용하는 1차 score:

```text
baseline_score =
  0.35 * risk_adj_rank
+ 0.25 * ret_rank
+ 0.15 * short_momentum_rank
+ 0.10 * liquidity_rank
+ 0.10 * drawdown_score
+ 0.05 * stability_score
```

구현 기준:

- `risk_adj_rank`: `riskAdjRet60d`
- `ret_rank`: `ret60d`
- `short_momentum_rank`: `ret20d`
- `liquidity_rank`: `tradeAmount20dAvg`
- `drawdown_score`: `1 + drawdown60d`, 0~1 clamp
- `stability_score`: 고변동성 감점용. 1 - normalized `vol60d` 또는 간단 percentile rank 사용

### Risk flags

`risk_flags`에 다음 항목을 포함한다.

```json
{
  "highVolatility": true,
  "deepDrawdown": false,
  "lowLiquidity": false,
  "chaseRisk": false,
  "monthlyTarget": 0.05,
  "baselineOnly": true,
  "missingMicrostructureData": true
}
```

판정 후보:

- `highVolatility`: `vol60d > 0.05`
- `deepDrawdown`: `drawdown60d < -0.25`
- `lowLiquidity`: `liquidity_rank < 0.25`
- `chaseRisk`: `ret5d > 0.12 AND drawdown60d > -0.03`

### Reason JSON

`reason`에 다음 항목을 포함한다.

```json
{
  "engine": "mp_core_monthly_5pct_baseline",
  "targetMonthlyReturn": 0.05,
  "riskAdjRank": 0.0,
  "retRank": 0.0,
  "shortMomentumRank": 0.0,
  "liquidityRank": 0.0,
  "drawdownScore": 0.0,
  "stabilityScore": 0.0
}
```

### 선물/공매도/장외 데이터 처리

- 이번 구현에서 실제 score에 넣지 않는다.
- 이유: 현재 DB feature와 수집 파이프라인이 없다.
- 문서와 reason/riskFlags에는 `missingMicrostructureData`를 남겨 후속 확장 지점을 명확히 한다.
- 후속 구현 순서:
  1. 외국인/기관 수급 실제 feature 반영
  2. 공매도/대차 종목별 feature 반영
  3. KOSPI200 선물 market regime overlay 반영
  4. 장외/시간외 거래 event factor 반영

### Acceptance Criteria

- [x] AC-1: `/quant/core/backtests`는 `strategyId: 1` 일반 전략 결과가 아니라 MP_CORE signal 기반 백테스트를 실행하거나, 일반 전략 사용 시 MP_CORE 결과로 표시하지 않는다.
- [x] AC-2: `/quant/core/backtests/latest`는 MP_CORE 전용 backtest 결과만 조회한다.
- [x] AC-3: 월수익률 계산은 누적수익률 단순 나눗셈이 아니라 기간 기준 복리 월환산으로 계산한다.
- [x] AC-4: 대시보드에 표시되는 backtest `strategyId/runId`가 실제 MP_CORE 결과와 일치한다.
- [x] AC-5: 2% 수익률의 기준 기간, 총수익률, 월환산 방식, 사용 전략을 확인할 수 있다.
- [x] AC-6: 위 정합성 수정 후 `MpCoreModelDefinition`의 기본 목표 월수익률은 `0.05`이며 보장 수익으로 표현하지 않는다.
- [x] AC-7: feature label의 WINNER 기준 조정은 MP_CORE 전용 backtest 정합성 확인 후 적용한다.
- [x] AC-8: 기존 `/api/quant/core/*` API 경로와 응답 구조는 깨지지 않는다.
- [x] AC-9: `market-pulse-api` 컴파일이 통과한다.
- [x] AC-10: 후속 데이터인 선물/공매도/장외 거래를 임의 더미 값으로 넣지 않는다.

### 검증 명령

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw -DskipTests compile
```

필요 시 프론트 변경이 발생하면:

```bash
cd market-pulse-web
npm run build
```

### 승인 후 구현 순서

1. MP_CORE backtest와 일반 strategy backtest가 섞이는 문제 수정
2. latest backtest 조회가 MP_CORE 결과만 읽도록 수정
3. 월수익률 계산 방식 정합화
4. 현재 2%의 기준 기간/총수익률/전략을 화면 또는 response에서 확인 가능하게 정리
5. 이후 `MpCoreModelDefinition`, feature label, signal score를 월 5% 목표에 맞춰 조정
6. 컴파일 검증
7. workation-verifier 역할 기준으로 AC PASS/FAIL 기록
8. 작업 로그 업데이트
