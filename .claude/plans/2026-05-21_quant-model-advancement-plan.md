# Quant 모델 고도화 기획

작성일: 2026-05-21  
상태: PLANNING_DRAFT  
기준 자료: `.claude/quant/01~17`, 기존 `MP_CORE` 기획, 현재 `/quant` 구현 흐름

## 1. 목적

어제 추가된 `.claude/quant` 자료를 기준으로 Market Pulse의 퀀트 모델을 단순 백테스트 전략 묶음에서 재현 가능한 단일 코어 모델 체계로 고도화한다.

이번 고도화의 핵심은 새 전략을 많이 늘리는 것이 아니라, `MP_CORE` 하나를 더 믿을 수 있게 만드는 것이다.

- 가격, 유동성, 수급, 변동성, 베타, 섹터 정보를 feature snapshot으로 고정한다.
- raw 값, 모델용 전처리값, 화면 표시값을 분리한다.
- Random Forest 기반 분류 모델을 중심으로 로짓/팩터 점수를 보조 검증 도구로 둔다.
- 포트폴리오는 점수 기반 비중 + 종목/섹터/시장/현금 제약으로 시작한다.
- 백테스트는 비용, 회전율, drawdown, 월별 성과, 벤치마크 대비 성과까지 검증한다.
- 사용자 화면에는 수익 보장처럼 보이는 문구를 쓰지 않는다.

## 2. 현재 판단

기존 6~7개 전략을 병렬로 늘리는 방식은 사용자가 이해하기 어렵고, 실제 모델 개선에도 분산이 크다.

따라서 1차 고도화는 아래 방향이 맞다.

| 항목 | 결정 |
|---|---|
| 중심 모델 | `MP_CORE` 단일 모델 유지 |
| 알고리즘 | `RandomForestClassifier` 우선, Logistic Regression은 baseline |
| 예측 목표 | 다음 20영업일 기준 `WINNER / NEUTRAL / LOSER` 분류 |
| 주요 데이터 | `market_daily_price`, `stock_master`, 수급 snapshot, 지수 데이터 |
| 보류 데이터 | 재무제표, 컨센서스, 뉴스 NLP, 공시 NLP |
| 포트폴리오 | score 기반 비중 + 리스크 제약 |
| 검증 | walk-forward + 비용 차감 백테스트 + factor diagnostics |

## 3. 자료별 반영 요약

| 자료 | 핵심 내용 | 이번 반영 |
|---|---|---|
| `03-분류모델.md` | 로짓, 나이브 베이즈, Winner/Loser 분류 | 로짓을 baseline으로 두고 분류 확률 해석 기준 마련 |
| `04-머신러닝-랜덤포레스트.md` | Random Forest, 과적합 방지, feature importance | `MP_CORE` 주 모델로 사용 |
| `06-퀀트투자-전체프로세스.md` | DB 구축 -> 팩터 -> 모델 -> scoring -> 포트폴리오 -> 백테스트 | 전체 개발 순서의 기준 |
| `12-퀀트-전략을-이용한-종목선정-기본.md` | 베타, 저변동성, 모멘텀, 밸류, 퀄리티 | 가격/변동성/베타는 즉시 반영, 밸류/퀄리티는 보류 |
| `13-퀀트-전략을-이용한-종목선정-심화.md` | 섹터 중립, winsorizing, rank z-score, QVM | 섹터 rank, 이상치 처리, z-score 결합 즉시 반영 |
| `14-포트폴리오-구성.md` | 비중 제약, 섹터 제한, 정수 주식수 | 포트폴리오 엔진 고도화에 반영 |
| `15-포트폴리오-백테스트.md` | BOP/EOP, 회전율, 비용, 신호일/체결일 분리 | 백테스트 신뢰성 개선 |
| `16-성과-및-위험-평가.md` | Sharpe, MDD, Calmar, rolling, factor exposure | 성과 검증 지표 확장 |
| `17-레퍼런스.md` | 참고문헌과 모델 후보 분류 | 다음 모델 후보 분리 기준 |

## 4. 모델 범위

### 4.1 이번에 할 것

- `MP_CORE` feature snapshot 생성
- 가격/변동성/베타/유동성/수급 feature 계산
- 섹터/시장 rank 및 z-score 계산
- winsorizing 또는 clipping 기반 이상치 처리
- `WINNER / NEUTRAL / LOSER` label 생성
- Random Forest 학습 스크립트 또는 서비스 구조 설계
- 모델 버전 관리
- 신호 생성과 포트폴리오 목표 비중 생성
- 비용 차감 백테스트
- `/quant` 화면을 단일 코어 모델 중심으로 정리

### 4.2 이번에 하지 않을 것

- 수익률 보장 문구
- 재무제표 기반 Value/Quality 정식 구현
- Magic Formula, QVM 별도 전략 구현
- 뉴스, 공시, SNS NLP
- 공분산 최적화 기반 최소분산/위험균형 포트폴리오
- 실거래 주문 연동

## 5. Feature 설계

### 5.1 가격/모멘텀

| Feature | 설명 |
|---|---|
| `ret_5d` | 최근 5영업일 수익률 |
| `ret_20d` | 최근 20영업일 수익률 |
| `ret_60d` | 최근 60영업일 수익률 |
| `ret_120d` | 최근 120영업일 수익률 |
| `ret_252d` | 최근 252영업일 수익률 |
| `ret_20d_ex_recent_5d` | 최근 과열 구간을 제외한 단기 모멘텀 |
| `risk_adj_ret_60d` | 60일 수익률 / 60일 변동성 |
| `risk_adj_ret_252d` | 252일 수익률 / 252일 변동성 |

### 5.2 변동성/리스크

| Feature | 설명 |
|---|---|
| `vol_20d` | 20일 수익률 표준편차 |
| `vol_60d` | 60일 수익률 표준편차 |
| `vol_252d` | 252일 수익률 표준편차 |
| `downside_vol_60d` | 하락 수익률만 기준으로 본 변동성 |
| `drawdown_60d` | 최근 60일 고점 대비 하락률 |
| `mdd_120d` | 최근 120일 최대낙폭 |
| `beta_120d` | 시장 대비 120일 베타 |
| `beta_252d` | 시장 대비 252일 베타 |
| `market_corr_252d` | 시장 수익률과의 상관 |

### 5.3 유동성/체결 가능성

| Feature | 설명 |
|---|---|
| `trade_amount_20d_avg` | 20일 평균 거래대금 |
| `trade_amount_60d_avg` | 60일 평균 거래대금 |
| `volume_zscore_20d` | 최근 거래량 급증 여부 |
| `liquidity_rank_market` | 시장 내 유동성 순위 |
| `liquidity_rank_sector` | 섹터 내 유동성 순위 |

### 5.4 수급/행동 신호

수급 데이터는 현재 확보 범위를 먼저 확인해야 한다. 종목별 일별 외국인/기관 수급이 충분히 있으면 아래 feature를 만든다.

| Feature | 설명 |
|---|---|
| `foreign_net_buy_5d` | 외국인 5일 순매수 |
| `foreign_net_buy_20d` | 외국인 20일 순매수 |
| `institution_net_buy_5d` | 기관 5일 순매수 |
| `institution_net_buy_20d` | 기관 20일 순매수 |
| `foreign_flow_rank_sector` | 섹터 내 외국인 수급 순위 |
| `institution_flow_rank_sector` | 섹터 내 기관 수급 순위 |

수급 데이터가 종목 단위로 충분하지 않으면 MVP에서는 수급 feature를 optional로 두고, 가격/유동성/리스크 feature만으로 학습한다.

### 5.5 섹터/시장 중립 feature

| Feature | 설명 |
|---|---|
| `ret_60d_rank_market` | 전체 시장 내 60일 수익률 rank |
| `ret_60d_rank_sector` | 섹터 내 60일 수익률 rank |
| `sector_z_momentum` | 섹터 평균 대비 모멘텀 z-score |
| `sector_z_volatility` | 섹터 평균 대비 변동성 z-score |
| `sector_z_liquidity` | 섹터 평균 대비 유동성 z-score |
| `market_bucket` | KOSPI / KOSDAQ |
| `sector_bucket` | stock_master sector |

## 6. 전처리 원칙

### 6.1 값의 세 층 분리

| 구분 | 용도 |
|---|---|
| `raw_value` | 원천 데이터 보관 |
| `model_value` | winsorizing, log transform, rank normalize를 적용한 모델 입력 |
| `display_value` | 화면 표시용으로 clipped/rounded된 값 |

### 6.2 이상치 처리

| 데이터 | 처리 |
|---|---|
| 일간 수익률 | raw 보관 + model value는 1%/99% winsorizing |
| 누적 수익률 | extreme return clipping |
| 거래대금 | log transform 우선 |
| 수급 금액 | 거래대금 대비 비율 또는 rank 변환 |
| 변동성 | 결측/0 값 제거 후 rank 변환 |
| 베타 | 회귀 표본 부족 시 null, 모델에는 missing flag 추가 |

### 6.3 결측 처리

- 신규상장 등으로 rolling window가 부족한 종목은 해당 feature를 null로 둔다.
- 결측이 많은 종목은 universe에서 제외한다.
- 일부 feature만 결측이면 missing flag를 함께 넣는다.
- 재무 데이터처럼 시점 통제가 어려운 feature는 이번 버전에서 제외한다.

## 7. Label 설계

기본 label은 다음 20영업일 수익률과 벤치마크 대비 초과수익을 같이 본다.

| Label | 조건 |
|---|---|
| `WINNER` | 다음 20영업일 수익률이 `+8%` 이상이고 벤치마크 대비 초과수익이 `+3%` 이상 |
| `LOSER` | 다음 20영업일 수익률이 `-5%` 이하이거나 벤치마크 대비 초과수익이 `-3%` 이하 |
| `NEUTRAL` | 그 외 |

주의:

- label 생성에는 미래 데이터를 쓰지만, feature 생성에는 절대 미래 데이터를 쓰지 않는다.
- label 기준은 실험 파라미터로 저장한다.
- KOSPI 종목은 KOSPI, KOSDAQ 종목은 KOSDAQ 벤치마크를 우선 사용한다.

## 8. 학습/검증 방식

### 8.1 Walk-forward

기본 구조:

```text
train: 24개월
validation: 6개월
test: 6개월
rolling step: 6개월
최소 전체 기간: 36개월
```

### 8.2 모델 후보

| 모델 | 용도 |
|---|---|
| Logistic Regression | baseline, 계수 방향성 확인 |
| Random Forest | 1차 주 모델 |
| Gradient Boosting | 2차 비교 후보 |
| Naive Bayes | 텍스트/NLP 확장 전까지 보류 |

### 8.3 Random Forest 기본값 후보

```text
n_estimators = 100
max_leaf_nodes = 40
max_features = sqrt 또는 8
class_weight = balanced 검토
random_state = 고정
```

### 8.4 검증 지표

모델 분류 지표:

- Accuracy
- Precision(WINNER)
- Recall(WINNER)
- F1(WINNER)
- Confusion matrix
- Class distribution
- Feature importance
- Calibration curve

투자 성과 지표:

- 비용 전/후 누적수익률
- 연율화 수익률
- 월 환산 수익률
- 연율화 변동성
- Sharpe
- MDD
- Calmar
- 월별 수익률
- 승률
- 회전율
- 총 비용
- 벤치마크 대비 초과수익

## 9. Portfolio 구성

### 9.1 Universe

기본 universe:

- KOSPI + KOSDAQ
- 최근 20영업일 평균 거래대금 상위 300개
- 최소 252영업일 이상 가격 데이터가 있는 종목
- 거래정지, 관리종목, 데이터 결측 심한 종목 제외

### 9.2 Candidate 선정

```text
P(WINNER) >= 0.55
score 상위 topN
유동성 rank 기준 통과
변동성/베타 과도 종목 제외 또는 감점
```

### 9.3 Score

초기 score 구조:

```text
core_score =
  winner_prob_score
  + momentum_score
  + liquidity_score
  + flow_score
  - volatility_penalty
  - drawdown_penalty
  - beta_penalty
```

수급 데이터가 부족하면 `flow_score`는 제외한다.

### 9.4 비중 산정

기본 규칙:

```text
1. score <= threshold 종목 제외
2. score를 0 이상 값으로 변환
3. score 합으로 기본 비중 계산
4. 변동성 역가중 적용
5. 종목별 maxWeight 적용
6. 섹터별 maxSectorWeight 적용
7. KOSDAQ maxWeight 적용
8. 신호 평균이 낮으면 현금 비중 확대
9. 정수 주식수로 target shares 계산
10. 비용과 세금 반영
```

기본 제약 후보:

| 제약 | 값 |
|---|---:|
| 종목 수 | 8~20 |
| 종목 최대 비중 | 15% |
| 섹터 최대 비중 | 35% |
| KOSDAQ 최대 비중 | 50% |
| 현금 최소 비중 | 0~30%, 시장 국면에 따라 동적 |
| 최대 회전율 | 리밸런싱당 50% 검토 |

## 10. Backtest 고도화

### 10.1 날짜 분리

아래 날짜를 명확히 분리한다.

| 날짜 | 의미 |
|---|---|
| `featureDate` | feature snapshot 기준일 |
| `signalDate` | 모델 신호 생성일 |
| `rebalanceDate` | 목표 비중 산정일 |
| `executionDate` | 체결 가격 적용일 |
| `returnStartDate` | 수익률 반영 시작일 |
| `returnEndDate` | 수익률 반영 종료일 |

안전한 기본값:

```text
D일 종가 기준 feature/signal 생성
D+1영업일 시가 우선 체결
시가가 없으면 D+1 종가 체결로 fallback
```

### 10.2 비용

```text
buy_fee_rate = 0.00015
sell_fee_rate = 0.00015
sell_tax_rate = 0.0018
slippage_rate = optional
```

### 10.3 필수 로그

- 리밸런싱 로그
- 목표 비중
- 실제 체결 수량
- 매수/매도 금액
- 수수료/세금
- 회전율
- 현금 비중
- 비용 전/후 equity
- trade log

## 11. DB 설계 초안

### 11.1 모델 버전

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
    label_policy JSONB NOT NULL,
    model_path TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_model_version UNIQUE (model_code, version)
);
```

### 11.2 Feature snapshot

```sql
CREATE TABLE quant_core_feature_snapshot (
    id BIGSERIAL PRIMARY KEY,
    signal_date DATE NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    market VARCHAR(10),
    sector VARCHAR(100),
    features JSONB NOT NULL,
    preprocessing_meta JSONB,
    label VARCHAR(20),
    forward_return NUMERIC(12, 6),
    benchmark_return NUMERIC(12, 6),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_core_feature UNIQUE (signal_date, asset_code)
);
```

### 11.3 Signal

```sql
CREATE TABLE quant_core_signal (
    id BIGSERIAL PRIMARY KEY,
    model_version_id BIGINT NOT NULL REFERENCES quant_model_version(id),
    signal_date DATE NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    market VARCHAR(10),
    sector VARCHAR(100),
    winner_prob NUMERIC(10, 6) NOT NULL,
    neutral_prob NUMERIC(10, 6),
    loser_prob NUMERIC(10, 6),
    score NUMERIC(12, 6) NOT NULL,
    rank INTEGER,
    target_weight NUMERIC(10, 6),
    reason JSONB,
    risk_flags JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_core_signal UNIQUE (model_version_id, signal_date, asset_code)
);
```

### 11.4 Portfolio target

```sql
CREATE TABLE quant_portfolio_target (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT,
    model_version_id BIGINT REFERENCES quant_model_version(id),
    rebalance_date DATE NOT NULL,
    signal_date DATE,
    execution_date DATE,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    sector VARCHAR(100),
    target_weight NUMERIC(18, 8) NOT NULL,
    target_amount NUMERIC(20, 4),
    target_shares NUMERIC(20, 4),
    model_score NUMERIC(18, 8),
    risk_adjustment NUMERIC(18, 8),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.5 Rebalance log

```sql
CREATE TABLE quant_rebalance_log (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL,
    rebalance_date DATE NOT NULL,
    signal_date DATE,
    execution_date DATE,
    gross_equity NUMERIC(20, 4),
    net_equity NUMERIC(20, 4),
    turnover NUMERIC(18, 8),
    buy_amount NUMERIC(20, 4),
    sell_amount NUMERIC(20, 4),
    fee_amount NUMERIC(20, 4),
    tax_amount NUMERIC(20, 4),
    cash_weight NUMERIC(18, 8),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 12. API 설계 초안

조회 API는 공개, 학습/생성/활성화 API는 ADMIN 전용으로 둔다.

```http
GET  /api/quant/core/model
GET  /api/quant/core/features?date=YYYYMMDD&page=0&size=50
POST /api/quant/core/features?from=YYYYMMDD&to=YYYYMMDD
POST /api/quant/core/train
POST /api/quant/core/signals/generate?date=YYYYMMDD
GET  /api/quant/core/signals?date=YYYYMMDD
POST /api/quant/core/backtests
GET  /api/quant/core/backtests
GET  /api/quant/core/backtests/{runId}
GET  /api/quant/core/backtests/{runId}/rebalance
GET  /api/quant/core/backtests/{runId}/metrics
GET  /api/quant/core/diagnostics/factor-correlation?date=YYYYMMDD
GET  /api/quant/core/diagnostics/sector-exposure?date=YYYYMMDD
POST /api/quant/core/model/{version}/activate
```

## 13. Frontend 설계

`/quant`는 여러 전략 탭보다 `MP_CORE` 중심 화면으로 정리한다.

### 13.1 화면 구성

1. 모델 상태
   - 활성 모델 버전
   - 학습 기간
   - 마지막 신호 생성일
   - target monthly return
   - 보장 아님 표시

2. 최신 신호
   - 순위
   - 종목명/코드
   - 시장/섹터
   - 상승 확률
   - score
   - 목표 비중
   - 주요 사유
   - 리스크 flag

3. 백테스트 결과
   - 비용 전/후 equity curve
   - drawdown chart
   - 월별 수익률 heatmap
   - 성과 카드
   - 회전율/비용 chart

4. 포트폴리오 진단
   - 섹터 비중
   - KOSPI/KOSDAQ 비중
   - 현금 비중
   - 위험기여도 후보

5. ADMIN 패널
   - feature 생성
   - 학습 실행
   - signal 생성
   - 모델 활성화

### 13.2 금지 문구

- 수익 보장
- 월 15% 확정
- 무조건 수익
- AI가 보장

허용 문구:

- 목표 월 환산 수익률
- 백테스트 기준
- 비용 차감 후
- 위험 조정 성과
- 모델 신호

## 14. 구현 순서

### Phase 1. 데이터/스키마 정리

- `market_daily_price` 컬럼과 기간 확인
- `stock_master` sector 품질 확인
- 수급 데이터의 종목/일자 단위 보유 여부 확인
- RDS 이관 후 통합 DB 기준으로 feature 생성 준비
- core schema DDL 작성

### Phase 2. Feature snapshot

- 가격/모멘텀 feature 생성
- 변동성/베타 feature 생성
- 유동성 feature 생성
- 섹터 rank/z-score 생성
- 수급 feature는 데이터 확인 후 optional 추가
- label 생성

### Phase 3. 학습

- Python 학습 스크립트 구성
- Logistic Regression baseline 생성
- Random Forest 학습
- walk-forward 검증
- feature importance 저장
- model artifact 저장

### Phase 4. Signal/Portfolio

- 신호 생성 API
- score 계산
- 목표 비중 산정
- 종목/섹터/KOSDAQ/현금 제약 적용
- risk flag 생성

### Phase 5. Backtest/Diagnostics

- 신호일/체결일 분리
- 비용 전/후 equity curve
- 회전율/비용 로그
- drawdown/monthly return 계산
- factor correlation, sector exposure 진단

### Phase 6. UI

- `/quant` 단일 MP_CORE 화면 전환
- 최신 신호 테이블
- 백테스트 차트
- 포트폴리오 진단
- ADMIN 액션

## 15. Acceptance Criteria

### Backend

- `GET /api/quant/core/model`은 활성 `MP_CORE` 모델 상태를 반환한다.
- feature 생성은 신호일 이후 데이터를 사용하지 않는다.
- feature snapshot은 같은 날짜/종목에 대해 재현 가능하게 저장된다.
- label 생성은 forward return과 benchmark return을 함께 저장한다.
- Random Forest 학습 결과는 model version으로 저장된다.
- `targetIsGuarantee`는 항상 `false`다.
- signal은 `winnerProb`, `score`, `targetWeight`, `reason`, `riskFlags`를 포함한다.
- 포트폴리오 비중은 종목/섹터/시장/현금 제약을 만족한다.
- 백테스트는 매수 수수료, 매도 수수료, 매도세를 반영한다.
- 백테스트는 signal date와 execution date를 분리한다.
- 성과 지표는 net return 기준을 기본으로 제공한다.

### Frontend

- `/quant` 첫 화면은 단일 `MP_CORE` 모델 중심이다.
- 기존 전략 6~7개는 기본 화면에서 노출하지 않는다.
- 최신 신호 테이블은 상승 확률, 목표 비중, 사유, 리스크 flag를 보여준다.
- 백테스트 결과는 비용 전/후 구분이 가능하다.
- drawdown chart와 monthly return heatmap이 표시된다.
- ADMIN이 아니면 학습/신호 생성/활성화 버튼이 보이지 않는다.
- 화면 어디에도 수익 보장 표현이 없다.

### Verification

- 프론트 `npm run build` 또는 `npm.cmd run build` 성공.
- 백엔드 Maven 환경 준비 후 `mvn test` 또는 `mvn -DskipTests compile` 성공.
- verifier는 look-ahead bias, 비용 반영, target guarantee false, 기존 전략 미노출 여부를 확인한다.
- feature snapshot 생성 결과와 백테스트 결과가 같은 입력에서 반복 실행 시 동일하다.

## 16. 리스크와 확인 필요 사항

| 리스크 | 영향 | 확인/대응 |
|---|---|---|
| 종목별 수급 데이터 부족 | flow feature 제외 필요 | 현재 DB 테이블과 수집 범위 확인 |
| sector 정보 품질 낮음 | 섹터 중립 rank 왜곡 | stock_master sector 정제 |
| Maven 미설치 | 백엔드 검증 지연 | Maven wrapper 추가 또는 Maven 설치 |
| RDS 이관 전 로컬/운영 데이터 불일치 | feature 학습 데이터 흔들림 | RDS 병합 후 통합 DB 기준으로 생성 |
| 재무 데이터 부재 | Value/Quality 구현 제한 | v2로 보류 |
| 과최적화 | 백테스트 성과 과대평가 | walk-forward, 비용 차감, rolling 성과 확인 |

## 17. 오늘 작업 제안

1. RDS 생성 전까지는 코드 구현보다 DB/feature 구조 확정.
2. 현재 DB에 실제로 있는 quant 관련 테이블과 컬럼 점검.
3. `market_daily_price` 데이터 기간, 종목 수, open/close/market_cap 유효성 확인.
4. 수급 데이터가 종목별 일자 단위로 있는지 확인.
5. 위 결과에 따라 `flow_score`를 1차 포함할지 optional로 둘지 결정.
6. Maven 실행 환경 정리.
7. RDS 생성 완료 후 로컬/운영 데이터를 병합하고, 통합 DB 기준으로 feature snapshot 생성.

## 18. 결론

이번 고도화의 방향은 "더 많은 전략"이 아니라 "더 검증 가능한 하나의 모델"이다.

`MP_CORE`는 가격/유동성/변동성/베타/섹터/수급 feature를 바탕으로 `WINNER / NEUTRAL / LOSER` 확률을 만들고, 그 확률을 곧장 수익 보장처럼 보여주지 않는다. 대신 목표 비중, 매매 사유, 리스크 flag, 비용 차감 백테스트, drawdown, 월별 성과를 함께 보여줘서 사용자가 모델 신호를 현실적으로 판단할 수 있게 한다.
