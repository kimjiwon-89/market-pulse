## Quant Return Boost

상태: PLANNING 초안. 사용자 승인 전 코드 구현 금지.

목표: 현재 무료 데이터 기반 quant 모델의 실제 백테스트 성과를 개선하기 위한 실험 시스템을 추가한다. 월 10%는 보장 수익률이 아니라 `targetMonthlyReturn = 0.10` 후보 필터링 기준과 결과 배지 기준이다.

### 범위

- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/controller/QuantController.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantBacktestService.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantExperimentService.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantExperimentGridFactory.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/AbstractQuantStrategy.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/MomentumStrategy.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/SectorRotationStrategy.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/DualMomentumStrategy.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/ShortTermReversalStrategy.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/QuantExperimentMapper.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentRunRequestDto.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentRunDto.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentVariantDto.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/ExperimentWindowDto.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentRunVo.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentVariantVo.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantExperimentWindowVo.java` 신규
- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/vo/QuantSignalLogVo.java` 신규
- 백엔드: `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`
- 백엔드: `market-pulse-api/src/main/resources/mapper/quant/QuantExperimentMapper.xml` 신규
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/index.tsx`
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/ExperimentPanel.tsx` 신규
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/VariantTable.tsx` 신규
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/DrawdownChart.tsx` 신규
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/MonthlyReturnHeatmap.tsx` 신규
- 프론트엔드: `market-pulse-web/src/types/index.ts`

### 현재 구현 구조 요약

- `QuantStrategyInitRunner`는 7개 전략을 seed한다: `MA_CROSSOVER`, `MOMENTUM`, `SECTOR_ROTATION`, `ASSET_ALLOCATION`, `VOLATILITY_ADJUST`, `DUAL_MOMENTUM`, `SHORT_TERM_REVERSAL`.
- `QuantBacktestService.backtest()`는 `quant_backtest_result` 캐시가 있으면 재계산하지 않고 반환한다.
- `AbstractQuantStrategy`는 `COMMISSION_RATE = 0.00015`, `SELL_TAX_RATE = 0.0018`, `TARGET_MONTHLY_RETURN = 0.10`을 이미 보유한다.
- `MarketDailyPriceMapper.xml`의 월간/주간 pick query는 현재 `rebalance_date` 당일의 `buy.close_price`를 신호 산출과 매수 가격에 동시에 사용한다. 이 방식은 실전 기준 look-ahead bias 가능성이 있으므로 이번 프로젝트에서 분리한다.
- `/quant` 프론트는 `QuantBacktest` 메인 컨테이너, `DateRangePicker`, `StrategyTabs`, `EquityChart`, `PerformanceCards`, `AllocationChart`, `TradeTimeline` 구조다.

### 백엔드 구현

#### 1. 실험 API

`QuantController.java`에 아래 엔드포인트를 추가한다.

```text
GET  /api/quant/experiments?strategyNameEn=&from=&to=&status=
POST /api/quant/experiments
GET  /api/quant/experiments/{runId}
GET  /api/quant/experiments/{runId}/trades?variantId=&page=&size=
POST /api/quant/experiments/{runId}/promote?variantId=
```

- `POST /api/quant/experiments`는 ADMIN 전용이다.
- `promote`는 즉시 운영 전략을 바꾸지 않고 `quant_experiment_variant.promoted = true`만 기록한다.
- 응답은 기존 패턴대로 `ApiResponse.success(data)`와 `ApiResponse.failure(message)`만 사용한다.

#### 2. DTO

`ExperimentRunRequestDto`

```text
fields:
- strategyNameEn: String
- from: String, YYYYMMDD
- to: String, YYYYMMDD
- initialCash: Long, 기본 100000000
- objective: String, 기본 MONTHLY_RETURN_GTE_10_AFTER_COST
- validationMode: String, WALK_FORWARD 고정
- maxVariants: Integer, 기본 50, 최대 100
```

`ExperimentRunDto`

```text
fields:
- id: Long
- strategyNameEn: String
- from: String
- to: String
- status: String, PENDING | RUNNING | DONE | FAILED
- targetMonthlyReturn: double
- targetIsGuarantee: boolean, 항상 false
- variants: List<ExperimentVariantDto>
- windows: List<ExperimentWindowDto>
- message: String
```

`ExperimentVariantDto`

```text
fields:
- id: Long
- runId: Long
- variantCode: String
- params: Map<String,Object>
- totalReturn: double
- annualizedReturn: double
- monthlyReturn: double
- mdd: double
- sharpeRatio: double
- turnover: double
- totalCost: long
- targetAchieved: boolean
- biasCheckStatus: String, PASS | FAIL
- overfitScore: double
- promoted: boolean
```

#### 3. QuantExperimentService

신규 클래스: `com.marketpulse.domain.quant.service.QuantExperimentService`

필수 메서드:

```text
ExperimentRunDto list(String strategyNameEn, String from, String to, String status)
ExperimentRunDto start(ExperimentRunRequestDto request)
ExperimentRunDto get(Long runId)
TradeLogPageDto getTrades(Long runId, Long variantId, int page, int size)
ExperimentVariantDto promote(Long runId, Long variantId)
```

동작:

- `start()`는 run row를 `RUNNING`으로 만들고 strategy별 grid를 생성한다.
- 각 variant는 signal/execution 분리 백테스트로 실행한다.
- `targetAchieved`는 비용과 세금 반영 후 `monthlyReturn >= 0.10`일 때만 true다.
- `targetIsGuarantee`는 항상 false다.
- walk-forward window가 2개 미만이면 run status를 `FAILED`로 저장한다.

#### 4. QuantExperimentGridFactory

신규 클래스: `com.marketpulse.domain.quant.service.QuantExperimentGridFactory`

모델별 허용 grid만 생성한다. 임의 실수 범위 탐색은 금지한다.

| 전략 | Grid |
|---|---|
| DUAL_MOMENTUM | lookbackDays: 63,126,252 / riskAssets: KOSPI+KOSDAQ+GOLD / defensive: CASH,KTB3Y,GOLD / regimeFilter: KOSPI_200D_ON_OFF true,false / volatilityTarget: 0.10,0.15,OFF |
| SHORT_TERM_REVERSAL | lookbackDays: 3,5,10 / topN: 5,10,20 / stopLossPct: 0.03,0.05,0.08 / takeProfitPct: 0.05,0.08,0.12 / marketCrashFilter: true,false |
| MOMENTUM | lookbackDays: 21,63,126 / topN: 10,20,30 / rebalanceCycle: MONTHLY,BIWEEKLY / liquidityFilter: true / volatilityTarget: 0.15,OFF |
| SECTOR_ROTATION | lookbackDays: 21,63,126 / topSectors: 2,3,4 / topStocksPerSector: 3,5 / sectorBreadthFilter: true,false / cashWhenNoSector: true |

#### 5. Look-ahead bias 방지

`MarketDailyPriceMapper.java`와 `MarketDailyPriceMapper.xml`에 bias-free query를 추가한다.

필수 규칙:

- `signal_date`는 리밸런싱 전 마지막 거래일이다.
- 신호 계산에 사용되는 모든 가격 row는 `trade_date <= signal_date` 조건을 가진다.
- `execution_date`는 `signal_date` 이후 첫 거래일이다.
- 매수 가격은 `execution_date`의 `open_price`가 있으면 open, 없으면 close를 사용한다.
- 매도 가격은 exit execution date의 open 우선, 없으면 close를 사용한다.
- `quant_signal_log`에 `signal_date`, `execution_date`, `asset_code`, `signal_score`, `selected`를 저장한다.

#### 6. 거래비용과 세금

`AbstractQuantStrategy`의 기존 상수를 유지한다.

- 매수: `commission = amount * 0.00015`
- 매도: `commission = amount * 0.00015`, `tax = amount * 0.0018`
- 리밸런싱 시 기존 보유분 매도 비용과 신규 매수 비용을 모두 반영한다.
- variant summary의 `totalCost`는 모든 `commission + tax` 합계다.

#### 7. 과최적화 방지

walk-forward 분리:

- 최소 전체 기간: 36개월.
- train: 24개월, validation: 6개월, test: 6개월 rolling.
- window가 2개 미만이면 FAILED.
- `overfitScore = abs(validationMonthlyReturn - testMonthlyReturn) + max(0, abs(testMdd) - abs(validationMdd))`.
- `overfitScore <= 0.15`인 variant만 승격 가능하다.

### 프론트엔드 구현

#### 1. 타입 추가

`src/types/index.ts`에 `QuantExperimentRun`, `QuantExperimentVariant`, `QuantExperimentWindow` 타입을 추가한다.

필드명은 백엔드 DTO와 동일한 camelCase를 사용한다.

#### 2. QuantBacktest/index.tsx

- 기존 `DateRangePicker`, `StrategyTabs`, `EquityChart`, `PerformanceCards`, `AllocationChart`, `TradeTimeline` 유지.
- 전략 비교 카드 아래에 `ExperimentPanel`을 추가한다.
- `activeStrategyId === null`이면 experiment panel은 전체 run 목록만 표시한다.
- 특정 전략 선택 시 해당 전략의 실험 run과 variant table을 표시한다.

#### 3. ExperimentPanel.tsx

props:

```text
strategies: QuantStrategy[]
activeStrategyId: number | null
from: string
to: string
```

동작:

- `GET /api/quant/experiments` 호출.
- ADMIN 토큰일 때만 `POST /api/quant/experiments` 실행 버튼 표시.
- 실행 버튼 클릭 후 status가 `RUNNING`이면 5초 간격으로 재조회한다.
- 월 10% 이상 variant는 `목표 달성` 배지를 표시한다.
- 어떤 위치에도 `보장`, `예상 확정`, `수익 보장` 문구를 표시하지 않는다.

#### 4. VariantTable.tsx

columns:

- Variant
- 월환산
- 총수익
- MDD
- Sharpe
- 회전율
- 총비용
- Bias
- Overfit
- 승격

정렬:

- 기본 정렬은 `targetAchieved DESC`, `overfitScore ASC`, `monthlyReturn DESC`.

#### 5. DrawdownChart.tsx

- variant equity curve에서 drawdown series를 계산해 Recharts AreaChart로 표시한다.
- 하락 색상은 design-guide 기준 `var(--down)` 사용.

#### 6. MonthlyReturnHeatmap.tsx

- variant equity curve를 월별 수익률로 변환해 표 형태로 표시한다.
- 상승은 `up`, 하락은 `down`, 보합은 `flat` 클래스를 사용한다.

### DB 변경

아래 DDL은 spec 예시이며 실제 적용은 구현 단계에서 수행한다.

```sql
CREATE TABLE quant_experiment_run (
    id                    BIGSERIAL PRIMARY KEY,
    strategy_name_en       VARCHAR(50) NOT NULL,
    from_date              DATE NOT NULL,
    to_date                DATE NOT NULL,
    initial_cash           BIGINT NOT NULL DEFAULT 100000000,
    objective              VARCHAR(50) NOT NULL,
    validation_mode        VARCHAR(30) NOT NULL DEFAULT 'WALK_FORWARD',
    target_monthly_return  NUMERIC(10,6) NOT NULL DEFAULT 0.10,
    target_is_guarantee    BOOLEAN NOT NULL DEFAULT FALSE,
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message                TEXT,
    created_at             TIMESTAMP DEFAULT NOW(),
    updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qer_strategy_period
ON quant_experiment_run(strategy_name_en, from_date, to_date, status);

CREATE TABLE quant_experiment_variant (
    id                 BIGSERIAL PRIMARY KEY,
    run_id             BIGINT NOT NULL REFERENCES quant_experiment_run(id) ON DELETE CASCADE,
    variant_code       VARCHAR(80) NOT NULL,
    params             JSONB NOT NULL,
    total_return       NUMERIC(12,6) NOT NULL DEFAULT 0,
    annualized_return  NUMERIC(12,6) NOT NULL DEFAULT 0,
    monthly_return     NUMERIC(12,6) NOT NULL DEFAULT 0,
    mdd                NUMERIC(12,6) NOT NULL DEFAULT 0,
    sharpe_ratio       NUMERIC(12,6) NOT NULL DEFAULT 0,
    turnover           NUMERIC(12,6) NOT NULL DEFAULT 0,
    total_cost         BIGINT NOT NULL DEFAULT 0,
    target_achieved    BOOLEAN NOT NULL DEFAULT FALSE,
    bias_check_status  VARCHAR(10) NOT NULL DEFAULT 'PASS',
    overfit_score      NUMERIC(12,6) NOT NULL DEFAULT 0,
    promoted           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_qev_run_variant UNIQUE(run_id, variant_code)
);

CREATE INDEX idx_qev_run_rank
ON quant_experiment_variant(run_id, target_achieved, overfit_score, monthly_return);

CREATE TABLE quant_experiment_window (
    id                    BIGSERIAL PRIMARY KEY,
    variant_id             BIGINT NOT NULL REFERENCES quant_experiment_variant(id) ON DELETE CASCADE,
    window_no              INTEGER NOT NULL,
    train_from             DATE NOT NULL,
    train_to               DATE NOT NULL,
    validation_from        DATE NOT NULL,
    validation_to          DATE NOT NULL,
    test_from              DATE NOT NULL,
    test_to                DATE NOT NULL,
    validation_monthly_return NUMERIC(12,6) NOT NULL DEFAULT 0,
    test_monthly_return       NUMERIC(12,6) NOT NULL DEFAULT 0,
    validation_mdd         NUMERIC(12,6) NOT NULL DEFAULT 0,
    test_mdd               NUMERIC(12,6) NOT NULL DEFAULT 0,
    created_at             TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_qew_variant_window UNIQUE(variant_id, window_no)
);

CREATE TABLE quant_signal_log (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT REFERENCES quant_experiment_run(id) ON DELETE CASCADE,
    variant_id      BIGINT REFERENCES quant_experiment_variant(id) ON DELETE CASCADE,
    strategy_name_en VARCHAR(50) NOT NULL,
    signal_date     DATE NOT NULL,
    execution_date  DATE NOT NULL,
    asset_code      VARCHAR(20) NOT NULL,
    asset_name      VARCHAR(100),
    signal_score    NUMERIC(18,8),
    selected        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_signal_before_execution CHECK (signal_date < execution_date)
);

CREATE INDEX idx_qsl_variant_dates
ON quant_signal_log(variant_id, signal_date, execution_date);
```

### API 설계

#### GET /api/quant/experiments

query:

- `strategyNameEn`: optional
- `from`: optional YYYYMMDD
- `to`: optional YYYYMMDD
- `status`: optional PENDING | RUNNING | DONE | FAILED

response:

```json
{
  "success": true,
  "data": {
    "runs": [
      {
        "id": 1,
        "strategyNameEn": "DUAL_MOMENTUM",
        "from": "20210101",
        "to": "20260520",
        "status": "DONE",
        "targetMonthlyReturn": 0.1,
        "targetIsGuarantee": false,
        "variants": []
      }
    ]
  }
}
```

#### POST /api/quant/experiments

request:

```json
{
  "strategyNameEn": "SHORT_TERM_REVERSAL",
  "from": "20210101",
  "to": "20260520",
  "initialCash": 100000000,
  "objective": "MONTHLY_RETURN_GTE_10_AFTER_COST",
  "validationMode": "WALK_FORWARD",
  "maxVariants": 50
}
```

response:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "status": "RUNNING",
    "targetMonthlyReturn": 0.1,
    "targetIsGuarantee": false
  }
}
```

### Acceptance Criteria

- [ ] AC-BE-1: `POST /api/quant/experiments`는 ADMIN 토큰 없이는 HTTP 403을 반환한다.
- [ ] AC-BE-2: `POST /api/quant/experiments` 응답과 `GET /api/quant/experiments/{runId}` 응답의 `targetIsGuarantee`는 항상 `false`다.
- [ ] AC-BE-3: `targetAchieved`는 비용과 세금 반영 후 `monthlyReturn >= 0.10`인 variant에서만 `true`다.
- [ ] AC-BE-4: `quant_signal_log`에는 `signal_date < execution_date` 제약이 존재한다.
- [ ] AC-BE-5: 실험 백테스트의 모든 매수 signal 계산 query는 `trade_date <= signal_date` 조건을 포함한다.
- [ ] AC-BE-6: 실험 백테스트의 매수 체결 가격은 `execution_date`의 `open_price` 우선, 없으면 `close_price`를 사용한다.
- [ ] AC-BE-7: 모든 SELL trade log의 `tax`는 `amount > 0`이면 0보다 크다.
- [ ] AC-BE-8: 모든 BUY/SELL trade log의 `commission`은 `amount > 0`이면 0보다 크다.
- [ ] AC-BE-9: 전체 기간이 36개월 미만이거나 walk-forward window가 2개 미만이면 run status는 `FAILED`다.
- [ ] AC-BE-10: `promote` API는 `overfitScore > 0.15`인 variant에 대해 `ApiResponse.failure`를 반환하고 `promoted`를 변경하지 않는다.
- [ ] AC-BE-11: `DUAL_MOMENTUM` grid에는 `lookbackDays` 63, 126, 252 외 값이 생성되지 않는다.
- [ ] AC-BE-12: `SHORT_TERM_REVERSAL` grid에는 `stopLossPct` 0.03, 0.05, 0.08 외 값이 생성되지 않는다.
- [ ] AC-BE-13: `MOMENTUM` grid에는 `topN` 10, 20, 30 외 값이 생성되지 않는다.
- [ ] AC-BE-14: `SECTOR_ROTATION` grid에는 `topSectors` 2, 3, 4 외 값이 생성되지 않는다.
- [ ] AC-FE-1: `/quant` 페이지에 실험 결과 영역이 표시된다.
- [ ] AC-FE-2: `VariantTable`은 Variant, 월환산, 총수익, MDD, Sharpe, 회전율, 총비용, Bias, Overfit, 승격 컬럼을 표시한다.
- [ ] AC-FE-3: 월환산 수익률 10% 이상 variant는 `목표 달성` 배지를 표시한다.
- [ ] AC-FE-4: `/quant` 화면의 실험 영역에는 `보장`, `수익 보장`, `확정 수익` 문자열이 존재하지 않는다.
- [ ] AC-FE-5: ADMIN이 아닌 사용자는 실험 실행 버튼을 볼 수 없다.
- [ ] AC-FE-6: run status가 `RUNNING`이면 `ExperimentPanel`은 5초 간격으로 `GET /api/quant/experiments/{runId}`를 재호출한다.
- [ ] AC-FE-7: `DrawdownChart`는 선택 variant가 없을 때 빈 상태 메시지를 표시하고 런타임 에러 없이 렌더링된다.
- [ ] AC-FE-8: `MonthlyReturnHeatmap`은 상승 월에 `up`, 하락 월에 `down`, 보합 월에 `flat` 클래스를 적용한다.

### 구현 제외

- 유료 데이터 구매 또는 외부 유료 API 연동.
- 월 10% 수익 보장 문구.
- 실거래 주문 API.
- 사용자별 실계좌/포트폴리오 저장.
