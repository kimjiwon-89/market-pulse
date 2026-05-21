# Quant Core Model 단일화 스펙

작성일: 2026-05-20  
상태: PLANNING_REVIEW  
기획 방향: 기존 6개 퀀트 모델 확장안을 중단하고, 먼저 검증 가능한 단일 모델 `MP-CORE`만 구현한다.

## 1. 결정사항

- 기존 6개 모델 체계는 보류한다.
- 기존 7개 전략 seed(`MA_CROSSOVER`, `MOMENTUM`, `SECTOR_ROTATION`, `ASSET_ALLOCATION`, `VOLATILITY_ADJUST`, `DUAL_MOMENTUM`, `SHORT_TERM_REVERSAL`)은 다음 구현에서 사용자-facing 기본 전략 목록에서 제거하거나 비활성화한다.
- 1차 모델은 `MP-CORE: Market Pulse Core Quant Model` 하나만 노출한다.
- 투자 universe는 거래대금 상위 유동 종목으로 제한한다.
- 월 15%는 수익 보장이 아니라 `targetMonthlyReturn = 0.15` 목표/필터 기준이다.
- 첫 구현은 무료/기존 데이터로 가능한 가격, 거래량, 시가총액, 수급, 시장 국면 피처 중심으로 만든다.
- 재무, 컨센서스, 뉴스 NLP는 2차 확장으로 미룬다.

## 2. 모델 정의

| 항목 | 값 |
|---|---|
| 모델 코드 | `MP_CORE` |
| 모델명 | Market Pulse Core Quant Model |
| 알고리즘 | `RandomForestClassifier` 기준의 지도학습 분류 모델 |
| 투자 대상 | KOSPI/KOSDAQ 거래대금 상위 유동 종목 |
| 예측 목표 | 향후 20영업일 초과수익/절대수익이 기준 이상일 확률 |
| 리밸런싱 | 주간 또는 월간. MVP는 주간 리밸런싱 |
| 목표 수익률 | 월환산 15% 이상을 목표 지표로 표시. 보장 표현 금지 |
| 위험 관리 | 시장 국면 필터, 종목별 최대 비중, 손절, 익절, 현금 비중 |

## 3. 모델 철학

이 모델은 "좋은 종목 하나를 맞히는 모델"이 아니라 아래 4가지를 한 번에 관리한다.

1. 시장이 위험자산을 살 만한 국면인지 판단한다.
2. 유동성이 충분한 종목 중 상승 확률이 높은 후보를 고른다.
3. 확률과 리스크에 따라 포트폴리오 비중을 정한다.
4. 거래비용, 세금, 손절/익절, 현금화를 반영해 백테스트한다.

## 4. 데이터 요구사항

### 4.1 MVP 필수 데이터

| 데이터 | 현재 소스 | 용도 |
|---|---|---|
| 종목 OHLCV | `market_daily_price` | 수익률, 모멘텀, 변동성, 거래대금 |
| 시가총액 | `market_daily_price.market_cap` | 유동성/대형주 필터 |
| KOSPI/KOSDAQ 지수 | `market_daily_price` INDEX | 시장 국면, 벤치마크 |
| 외국인/기관 수급 | 기존 investor snapshot 또는 KIS/KRX 수급 적재 | 순매수 강도, 수급 모멘텀 |
| 종목 마스터 | `stock_master` | 종목명, 시장, 섹터 |

### 4.2 2차 확장 데이터

| 데이터 | 용도 | 비고 |
|---|---|---|
| 재무제표/재무비율 | 가치, 퀄리티 피처 | DART/FnSpace 검토 |
| 컨센서스/실적발표 | 어닝 서프라이즈, PEAD | 유료 데이터 가능성 높음 |
| 뉴스/공시 감성 | 이벤트 위험 필터 | MVP 제외 |

## 5. 피처 설계

### 5.1 종목 단위 피처

- `ret_5d`, `ret_20d`, `ret_60d`: 단기/중기 수익률
- `vol_20d`, `vol_60d`: 수익률 변동성
- `turnover_amount_20d`: 20일 평균 거래대금
- `volume_zscore_20d`: 거래량 급증 여부
- `price_vs_ma20`, `price_vs_ma60`, `price_vs_ma120`: 추세 위치
- `drawdown_60d`: 최근 고점 대비 낙폭
- `market_cap_rank`: 시가총액 순위
- `liquidity_rank`: 거래대금 순위
- `foreign_net_buy_5d`, `foreign_net_buy_20d`: 외국인 수급
- `institution_net_buy_5d`, `institution_net_buy_20d`: 기관 수급

### 5.2 시장 국면 피처

- `kospi_ret_20d`, `kosdaq_ret_20d`
- `kospi_above_ma120`, `kosdaq_above_ma120`
- `market_breadth`: 상승 종목 비율
- `market_vol_20d`: 지수 변동성
- `cash_regime`: 시장 국면이 위험하면 현금 비중 확대

## 6. 레이블 정의

MVP 레이블은 20영업일 후 성과 기준 3-class로 정의한다.

| 클래스 | 조건 |
|---|---|
| `WINNER` | 향후 20영업일 수익률이 `+8%` 이상이고 벤치마크 대비 초과수익이 `+3%` 이상 |
| `NEUTRAL` | 위/아래 기준 사이 |
| `LOSER` | 향후 20영업일 수익률이 `-5%` 이하 또는 벤치마크 대비 초과수익이 `-3%` 이하 |

주의:
- 수익률 기준은 실험 파라미터로 둔다.
- 신호일 이후 데이터만 레이블에 사용한다.
- 학습/검증/테스트 분리 시 미래 데이터 누수 금지.

## 7. 학습/검증 방식

### 7.1 Walk-forward

- 최소 전체 기간: 36개월.
- train: 24개월.
- validation: 6개월.
- test: 6개월.
- 6개월 단위 rolling window.
- test 구간 성과만 최종 성과로 표시한다.

### 7.2 모델 성능 지표

| 지표 | 기준 |
|---|---|
| Accuracy | 참고 지표. 단독 합격 기준 아님 |
| Precision(WINNER) | 매수 후보 품질 판단 |
| Recall(WINNER) | 기회 포착력 판단 |
| Feature importance | 모델 설명용 |
| Calibration | 확률 점수 신뢰도 점검 |

### 7.3 투자 성과 지표

| 지표 | 기준 |
|---|---|
| 월환산 수익률 | 목표 15% 이상. 보장 아님 |
| MDD | 기본 경고선 -20%, 실패선 -30% |
| Sharpe | 1.0 이상 목표 |
| 승률 | 50% 이상 목표 |
| 손익비 | 1.2 이상 목표 |
| 총비용 | 수수료/세금 포함 |
| 회전율 | 과도한 회전율이면 실패 사유 표시 |

## 8. 포트폴리오 규칙

### 8.1 Universe

- 시장: KOSPI + KOSDAQ.
- 기본 필터: 최근 20영업일 평균 거래대금 상위 300개.
- 제외: 거래정지, 가격/거래량 결측, 20영업일 미만 상장, 관리종목 데이터가 있으면 제외.
- 최종 후보: 모델 `WINNER` 확률 상위 `topN=10`.

### 8.2 진입

- `P(WINNER) >= 0.55`인 종목만 후보.
- 후보가 부족하면 현금 보유.
- 시장 국면이 위험이면 신규 진입 금지 또는 총 주식 비중 축소.

### 8.3 비중

- 종목별 최대 비중: 15%.
- 총 주식 비중: 정상 국면 최대 100%, 위험 국면 최대 30%.
- 기본은 확률 점수와 변동성 역가중 혼합.

### 8.4 청산

- 손절: 진입가 대비 -7%.
- 익절: 진입가 대비 +15% 또는 trailing stop.
- 리밸런싱 시 topN 이탈 종목 매도.
- `P(WINNER) < 0.45`로 하락하면 매도 후보.

### 8.5 거래비용

- 매수 수수료: 0.015%.
- 매도 수수료: 0.015%.
- 매도세: 0.18%.
- 모든 백테스트와 목표 달성 여부는 비용 차감 후 계산한다.

## 9. 백엔드 구현 범위

### 9.1 신규/변경 패키지

- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/model/`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/model/`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/ml/`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/dto/`
- `market-pulse-api/src/main/resources/mapper/quant/`

### 9.2 핵심 서비스

| 클래스 | 역할 |
|---|---|
| `QuantCoreFeatureService` | 일자별 feature matrix 생성 |
| `QuantCoreLabelService` | 미래 수익률 기반 label 생성 |
| `QuantCoreTrainingService` | walk-forward 학습/검증 실행 |
| `QuantCoreSignalService` | 특정 날짜의 종목별 확률/랭킹 생성 |
| `QuantCoreBacktestService` | 포트폴리오 규칙 포함 백테스트 |
| `QuantCoreModelRegistryService` | 현재 활성 모델 버전 관리 |

### 9.3 ML 런타임 선택

1차 구현은 Java 안에서 끝내기보다 Python 학습 스크립트와 Java API를 분리하는 방식을 권장한다.

- Java/Spring: 데이터 적재, 백테스트 API, 결과 조회, 화면 응답.
- Python/scikit-learn: feature 학습, 모델 파일 생성, feature importance 산출.
- 모델 산출물: `market-pulse-api/models/quant/mp_core/<version>/model.joblib`, `metadata.json`.

이유:
- `.claude/quant` 자료가 scikit-learn 기준이다.
- RandomForest 구현, 검증, feature importance, calibration 관리가 Python이 훨씬 안정적이다.
- Spring Boot 안에 ML 라이브러리를 억지로 넣는 것보다 운영/실험 분리가 쉽다.

## 10. DB 변경

구현 단계에서 `QuantSchemaInitRunner` 또는 별도 SQL로 반영한다.

```sql
CREATE TABLE quant_model_version (
    id BIGSERIAL PRIMARY KEY,
    model_code VARCHAR(30) NOT NULL,
    version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    train_from DATE NOT NULL,
    train_to DATE NOT NULL,
    validation_summary JSONB,
    feature_schema JSONB NOT NULL,
    model_path TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_model_version UNIQUE (model_code, version)
);

CREATE TABLE quant_core_feature_snapshot (
    id BIGSERIAL PRIMARY KEY,
    signal_date DATE NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    market VARCHAR(10),
    features JSONB NOT NULL,
    label VARCHAR(20),
    forward_return NUMERIC(12,6),
    benchmark_return NUMERIC(12,6),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_core_feature UNIQUE (signal_date, asset_code)
);

CREATE TABLE quant_core_signal (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT NOT NULL REFERENCES quant_model_version(id),
    signal_date DATE NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    market VARCHAR(10),
    winner_prob NUMERIC(10,6) NOT NULL,
    neutral_prob NUMERIC(10,6),
    loser_prob NUMERIC(10,6),
    score NUMERIC(12,6) NOT NULL,
    rank INTEGER,
    target_weight NUMERIC(10,6),
    reason JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_core_signal UNIQUE (model_version_id, signal_date, asset_code)
);

CREATE TABLE quant_core_backtest_run (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT REFERENCES quant_model_version(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    initial_cash BIGINT NOT NULL,
    target_monthly_return NUMERIC(10,6) NOT NULL DEFAULT 0.15,
    target_is_guarantee BOOLEAN NOT NULL DEFAULT FALSE,
    total_return NUMERIC(12,6),
    monthly_return NUMERIC(12,6),
    mdd NUMERIC(12,6),
    sharpe NUMERIC(12,6),
    win_rate NUMERIC(12,6),
    profit_loss_ratio NUMERIC(12,6),
    total_cost BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## 11. API 설계

```http
GET  /api/quant/core/model
POST /api/quant/core/train
POST /api/quant/core/features?from=YYYYMMDD&to=YYYYMMDD
POST /api/quant/core/signals/generate?date=YYYYMMDD
GET  /api/quant/core/signals?date=YYYYMMDD
POST /api/quant/core/backtests
GET  /api/quant/core/backtests
GET  /api/quant/core/backtests/{runId}
POST /api/quant/core/model/{version}/activate
```

권한:
- 조회 API는 공개.
- 학습, feature 생성, signal 생성, backtest 실행, 모델 활성화는 ADMIN 전용.

응답:
- 기존 규칙대로 `ApiResponse.success(data)` / `ApiResponse.failure(message)`만 사용한다.

## 12. 프론트엔드 구현 범위

기존 `/quant` 화면은 다전략 비교 화면에서 `MP-CORE` 중심의 모델 관제 화면으로 바꾼다.

### 화면 구성

1. 모델 상태 카드
   - 활성 버전
   - 학습 기간
   - 마지막 신호 생성일
   - targetMonthlyReturn 15%, `보장 아님` 표시

2. 성과 카드
   - 월환산 수익률
   - 총수익률
   - MDD
   - Sharpe
   - 승률
   - 총비용

3. 최신 신호 테이블
   - 순위
   - 종목명
   - 시장
   - 상승 확률
   - 목표 비중
   - 신호 이유

4. 백테스트
   - 기간 선택
   - equity curve
   - drawdown
   - 월별 수익률 heatmap
   - 매매 로그

5. ADMIN 패널
   - feature 생성
   - 학습 실행
   - 신호 생성
   - 모델 버전 활성화

### UI 문구 금지

- 수익 보장
- 월 15% 확정
- 무조건 수익
- AI가 보장

허용 문구:
- 목표 월환산 수익률
- 백테스트 기준
- 비용 차감 후
- 위험 조정 성과
- 모델 신호

## 13. 기존 구현 정리 기준

- `QuantStrategyInitRunner`의 기존 전략 seed는 비활성화 또는 제거한다.
- 기존 strategy implementation 파일은 즉시 삭제하지 않고, `MP_CORE` 구현이 PASS된 뒤 dead code 여부를 판단한다.
- 사용자-facing `/quant/strategies`는 새 화면에서 사용하지 않는다.
- 기존 experiment API는 단일 Core 모델 실험 구조와 겹치므로 1차 구현에서는 숨긴다.
- 기존 캐시 테이블은 호환 유지하되 신규 Core 테이블을 우선 사용한다.

## 14. 수용 기준

### 백엔드 AC

- `GET /api/quant/core/model`이 `MP_CORE` 활성 모델 상태를 반환한다.
- 기존 6개/7개 전략이 기본 `/quant` 사용자 화면에 노출되지 않는다.
- `POST /api/quant/core/features`가 지정 기간 feature snapshot을 생성한다.
- feature 생성 시 신호일 이후 데이터를 피처에 사용하지 않는다.
- `POST /api/quant/core/train`은 walk-forward 검증 결과와 모델 버전을 생성한다.
- `POST /api/quant/core/signals/generate`는 특정 날짜의 종목별 확률과 target weight를 저장한다.
- `POST /api/quant/core/backtests`는 비용 차감 후 성과를 저장하고 반환한다.
- `targetIsGuarantee`는 항상 `false`다.
- 월 15% 달성 여부는 `monthlyReturn >= 0.15`인 배지/필터일 뿐 보장으로 표시하지 않는다.

### 프론트엔드 AC

- `/quant` 첫 화면은 단일 `MP-CORE` 모델 관제 화면이다.
- 기존 전략 탭은 기본 화면에서 제거된다.
- 최신 신호 테이블은 상승확률, 목표비중, 이유를 보여준다.
- 백테스트 성과에는 월환산 수익률, MDD, Sharpe, 승률, 총비용이 표시된다.
- 화면 어디에도 수익 보장 표현이 없다.
- ADMIN이 아니면 학습/신호생성/활성화 버튼이 보이지 않는다.

### 검증 AC

- 프론트 `npm run build` 성공.
- 백엔드 `mvn test` 또는 `mvn -DskipTests compile` 성공.
- verifier는 look-ahead bias, 비용 반영, target guarantee false, 기존 전략 미노출 여부를 확인한다.
- 검증 실패 시 구현 수정이 아니라 재기획 또는 스펙 보완으로 되돌아간다.

## 15. 구현 순서

1. 기존 quant 전략 노출/seed 구조 정리 계획 확정.
2. Core DB schema와 DTO/API 뼈대 추가.
3. feature snapshot 생성.
4. Python 학습 스크립트와 model artifact 저장.
5. signal generation API 연결.
6. Core backtest engine 구현.
7. `/quant` 프론트 단일 모델 화면으로 개편.
8. verifier 검증.

## 16. 남은 질문

- 외국인/기관 수급 데이터를 `market_daily_price`와 같은 날짜/종목 단위로 이미 충분히 보유하고 있는지 확인 필요.
- 관리종목/거래정지 필터 데이터 소스를 확정해야 한다.
- Python 학습 스크립트를 API 서버 내부에서 실행할지, 운영에서는 수동/배치로 실행할지 결정 필요.
- `open_price` 결측이 많으면 체결 가격을 close 기준으로 둘지 별도 룰이 필요하다.
