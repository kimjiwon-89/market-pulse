# Quant Model Redesign Research & API Plan

작성일: 2026-05-20  
목적: 기존 Quant 모델을 재정의하고, 공개 연구/백테스트에서 연환산 수익률 10% 초과 근거가 있는 모델 5개를 Market Pulse의 관리형 API 모델로 편입한다. 이후 모델 체계는 `단기 / 중기 / 장기`와 `위험형 / 안정형`의 2축으로 나누어 총 6개까지 확장한다.

> 주의: 아래 수익률은 공개 논문, 책, 리서치 사이트, 재현 백테스트에 나온 특정 기간의 과거 성과다. 실거래 수익률을 보장하지 않으며, 한국 시장 적용 전에는 생존편향, 거래비용, 세금, 유동성, 재무 데이터 시점 지연, 리밸런싱 가능일을 반영한 별도 백테스트가 필요하다.

---

## 1. 리서치 범위와 판단 기준

### 범위

- 공개 논문, 책, 공개 백테스트에서 널리 알려진 주식/ETF 기반 퀀트 모델
- 룰 기반으로 설명 가능한 모델
- Market Pulse에서 API로 모델별 관리가 가능한 구조
- 단기/중기/장기 투자 기간과 위험형/안정형 성향으로 분류 가능한 모델

### 제외 기준

- 룰이 불명확한 블랙박스 모델
- 수익률이 특정 블로그/개인 계좌 주장에만 의존하는 모델
- 레버리지, 옵션, 고빈도, 공매도 필수 전략
- 한국 개인 투자자 서비스에서 구현 난도가 지나치게 높은 전략

### 선정 기준

| 기준 | 설명 |
|---|---|
| 공개 성과 | 공개된 연환산 수익률 또는 CAGR이 10% 초과 |
| 재현 가능성 | 공식 룰이 단순하고 백테스트 엔진으로 검증 가능 |
| 데이터 가능성 | KRX/KIS/DART/재무 데이터로 구현 경로가 있음 |
| 서비스 적합성 | 사용자에게 모델별 신호, 포트폴리오, 백테스트를 보여주기 좋음 |

---

## 2. 공개 Quant 모델/매매법 리스트업

| 분류 | 모델/매매법 | 핵심 룰 | 공개 성과 | 판정 |
|---|---|---|---:|---|
| 가치+퀄리티 | Magic Formula | 높은 Earnings Yield + 높은 Return on Capital | Greenblatt 원 백테스트 1988-2004 약 30.8%/년 | 선정 |
| 가치+재무건전성 | Piotroski F-Score | 저 P/B 종목 중 F-Score 8~9 선별 | Piotroski 원 논문 1976-1996 약 23%/년 | 선정 |
| 방어형 멀티팩터 | Conservative Formula | 저변동성 500개 중 모멘텀 + 순주주환원율 상위 | Blitz/van Vliet, 1929-2016 약 15.1%/년 | 선정 |
| 모멘텀 | Dual Momentum / GEM | 상대 모멘텀 + 절대 모멘텀으로 주식/채권 전환 | Antonacci 1974-2013 약 17.43%/년 | 선정 |
| 단기 이벤트 | Post-Earnings Announcement Drift | 어닝 서프라이즈 이후 2~12주 드리프트 | EAR+SUE 조합 약 12.5% abnormal return/년 | 신규 선정 |
| 가치+모멘텀 | Value & Momentum Everywhere | 가치와 모멘텀 팩터를 50:50 결합 | 높은 Sharpe, 다자산 일관성. 수익률은 변동성 스케일 조건 의존 | 보조 연구 |
| 모멘텀 | 12-1 Price Momentum | 최근 12개월 수익률에서 최근 1개월 제외 후 상위 매수 | 장기 팩터 프리미엄 존재, 기간별 편차 큼 | 보조 연구 |
| 저변동성 | Low Volatility / Minimum Volatility | 변동성 낮은 종목 선별 | 수익률보다 위험 조정 성과가 핵심 | 제외 |
| 퀄리티 | Quality Minus Junk | 수익성, 성장성, 안전성, 배당/환원 품질 | 초과수익 근거는 강하나 단독 10% 기준 명확성 낮음 | 보조 연구 |
| 단기 반전 | Short-Term Reversal | 과매도/급락 종목의 주간 되돌림 | 주간 수익률 연구 존재. 거래비용 민감 | 6번째 후보 |
| 성장주 | CAN SLIM | 실적 성장 + 신고가 + 수급/시장 추세 | 정성 요소가 많고 공식 재현 난도 높음 | 제외 |
| 기술적 분석 | Turtle Trend Following | Donchian breakout + ATR 손절 | 선물 중심, 주식 롱온리 앱과 부적합 | 제외 |
| 차익거래 | Pairs Trading | 공적분/스프레드 평균회귀 | 거래비용, 공매도/레버리지 이슈 | 제외 |
| 머신러닝 | ML Cross-sectional Prediction | 특성 기반 기대수익 예측 | 논문별 성과 우수하나 데이터/검증 복잡 | 2차 후보 |

---

## 3. 최종 선정 모델 5개

### 1. MP-PEAD: Post-Earnings Announcement Drift

| 항목 | 내용 |
|---|---|
| 투자 기간 | 단기 |
| 성향 | 위험형 |
| 공개 근거 | Post-Earnings Announcement Drift, EAR/SUE 기반 어닝 서프라이즈 연구 |
| 공개 성과 | EAR와 SUE를 함께 활용한 전략에서 약 12.5% 연환산 abnormal return 사례 |
| 핵심 룰 | 실적 발표 직후 예상보다 강한 실적/가격 반응을 보인 종목을 선별하고 2~12주 보유 |
| 리밸런싱 | 이벤트 발생 시점 + 주간 점검 |
| Market Pulse 적합성 | 단기 모델 포지션을 채워준다. 사용자에게 "실적 발표 후 드리프트"라는 매수 이유를 설명하기 쉽다 |
| 데이터 의존 | 실적 발표일, 컨센서스, 실제 EPS/매출, 발표 전후 수익률 데이터 필요 |
| 우선 구현 | 재무/컨센서스 데이터가 붙기 전에는 `price reaction proxy`로 MVP 가능. 발표일 데이터 확보 후 정식 PEAD로 승격 |

### 2. MP-CF: Conservative Formula

| 항목 | 내용 |
|---|---|
| 투자 기간 | 중기 |
| 성향 | 안정형 |
| 공개 근거 | Pim van Vliet, David Blitz, Conservative Formula |
| 공개 성과 | 1929-2016 복리 연환산 약 15.1% |
| 핵심 룰 | 대형주 유니버스에서 36개월 저변동성 종목을 먼저 고르고, 12개월 모멘텀과 순주주환원율로 최종 선별 |
| 리밸런싱 | 월간 |
| 우선 구현 | MVP에서는 `저변동성 + 모멘텀`으로 시작하고, DART/재무 데이터가 붙으면 `net payout yield` 추가 |

### 3. MP-MF: Magic Formula + Momentum Filter

| 항목 | 내용 |
|---|---|
| 투자 기간 | 장기 |
| 성향 | 위험형 |
| 공개 근거 | Joel Greenblatt Magic Formula, Quant Investing의 Magic Formula + Momentum 확장 |
| 공개 성과 | Greenblatt 원 백테스트 약 30.8%/년. 유럽 데이터에서 모멘텀 결합 성과 개선 사례 |
| 핵심 룰 | Earnings Yield, ROIC로 좋은데 싼 기업을 고르고, 6개월 가격 모멘텀으로 가치 함정 필터링 |
| 리밸런싱 | 분기 또는 연간 |
| 데이터 의존 | EBIT, EV, 순운전자본, 고정자산 등 재무 데이터 필요 |

### 4. MP-PF: Piotroski Value Quality

| 항목 | 내용 |
|---|---|
| 투자 기간 | 장기 |
| 성향 | 안정형 |
| 공개 근거 | Joseph Piotroski, Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers |
| 공개 성과 | 1976-1996 약 23%/년 |
| 핵심 룰 | 저 P/B 종목 중 수익성, 레버리지/유동성, 영업 효율성 9개 신호로 F-Score 8~9 선별 |
| 리밸런싱 | 연간 또는 분기 |
| 데이터 의존 | 재무제표 시점 관리가 핵심. DART 또는 별도 재무 데이터 적재 필요 |

### 5. MP-DM: Dual Momentum / Global Equity Momentum

| 항목 | 내용 |
|---|---|
| 투자 기간 | 중기 |
| 성향 | 위험형 |
| 공개 근거 | Gary Antonacci Dual Momentum / GEM |
| 공개 성과 | 1974-2013 약 17.43%/년, 최대낙폭 약 -22.72%로 공개 |
| 핵심 룰 | KOSPI/KOSDAQ/미국 ETF/채권 ETF 등 후보 자산 중 상대 모멘텀 1위 선택. 절대 모멘텀이 음수면 방어자산 이동 |
| 리밸런싱 | 월간 |
| 우선 구현 | 가격 데이터만으로 가능하므로 5개 중 가장 먼저 구현 가능 |

---

## 4. 6개 모델 확장 방향성

최종 모델 체계는 투자 기간과 위험 성향을 조합해 6칸으로 관리한다. 현재 문서에서는 5개 모델만 확정하고, 비어 있는 `단기 안정형`은 2차 후보로 남긴다.

| 투자 기간 | 위험형 | 안정형 |
|---|---|---|
| 단기 | MP-PEAD: 실적 발표 후 드리프트 | 후보: MP-STR, Short-Term Reversal with Liquidity Filter |
| 중기 | MP-DM: Dual Momentum | MP-CF: Conservative Formula |
| 장기 | MP-MF: Magic Formula + Momentum | MP-PF: Piotroski Value Quality |

### 단기 안정형 후보: MP-STR

| 항목 | 내용 |
|---|---|
| 후보명 | MP-STR: Short-Term Reversal with Liquidity Filter |
| 핵심 룰 | 최근 1~5거래일 과매도 종목 중 유동성, 스프레드, 변동성 필터를 통과한 종목만 주간 단위로 반등 거래 |
| 장점 | 단기 안정형 칸을 채울 수 있고, 가격 데이터만으로 출발 가능 |
| 리스크 | 거래비용, 슬리피지, 급락장 연속 하락에 매우 민감 |
| 보류 이유 | 공개 수익률은 좋아 보이는 연구가 있지만 운영 모델로 만들려면 비용 차감 검증이 먼저 필요 |

---

## 5. 모델별 데이터 요구사항

| 모델 | 기간 | 성향 | 가격 | 재무 | 컨센서스/실적발표 | 배당/자사주 | ETF/지수 | MVP 가능성 |
|---|---|---|---:|---:|---:|---:|---:|---|
| MP-PEAD | 단기 | 위험형 | 필수 | 권장 | 필수 | 불필요 | 불필요 | 중간 |
| MP-DM | 중기 | 위험형 | 필수 | 불필요 | 불필요 | 불필요 | 필수 | 높음 |
| MP-CF | 중기 | 안정형 | 필수 | 선택 | 불필요 | 권장 | 불필요 | 중간 |
| MP-MF | 장기 | 위험형 | 필수 | 필수 | 불필요 | 불필요 | 불필요 | 낮음 |
| MP-PF | 장기 | 안정형 | 필수 | 필수 | 불필요 | 불필요 | 불필요 | 낮음 |
| MP-STR 후보 | 단기 | 안정형 | 필수 | 불필요 | 불필요 | 불필요 | 불필요 | 검증 필요 |

### 데이터 확장 제안

```sql
CREATE TABLE quant_model (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    horizon VARCHAR(20) NOT NULL,       -- SHORT | MID | LONG
    risk_profile VARCHAR(20) NOT NULL,  -- AGGRESSIVE | DEFENSIVE
    description TEXT,
    rebalance_cycle VARCHAR(20) NOT NULL,
    min_public_cagr NUMERIC(8,4),
    source_summary TEXT,
    params JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quant_model_run (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES quant_model(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    initial_cash BIGINT NOT NULL,
    benchmark_code VARCHAR(30),
    status VARCHAR(20) NOT NULL,
    cagr NUMERIC(10,6),
    total_return NUMERIC(10,6),
    max_drawdown NUMERIC(10,6),
    volatility NUMERIC(10,6),
    sharpe NUMERIC(10,6),
    params JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE quant_model_signal (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES quant_model(id),
    signal_date DATE NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(100),
    signal_type VARCHAR(20) NOT NULL,
    score NUMERIC(18,6),
    rank INTEGER,
    target_weight NUMERIC(10,6),
    reason JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_quant_model_signal UNIQUE (model_id, signal_date, asset_code)
);
```

---

## 6. API 설계

기존 `/api/quant/strategies`는 백테스트 전략 목록에 가깝다. 이번 개편에서는 모델을 별도 리소스로 두고, 모델별 설정·신호·백테스트·운영 포트폴리오를 관리한다.

### 모델 관리

```http
GET /api/quant/models?horizon=SHORT|MID|LONG&riskProfile=AGGRESSIVE|DEFENSIVE
GET /api/quant/models/{modelCode}
PATCH /api/quant/models/{modelCode}
POST /api/quant/models/{modelCode}/activate
POST /api/quant/models/{modelCode}/deactivate
```

### 모델별 백테스트

```http
POST /api/quant/models/{modelCode}/backtests
Body:
{
  "from": "20150101",
  "to": "20260520",
  "initialCash": 10000000,
  "benchmarkCode": "KOSPI",
  "params": {
    "rebalanceCycle": "MONTHLY",
    "topN": 20,
    "transactionCostBps": 19.5
  }
}

GET /api/quant/models/{modelCode}/backtests
GET /api/quant/models/{modelCode}/backtests/{runId}
DELETE /api/quant/models/{modelCode}/backtests/{runId}
```

### 모델별 신호와 포트폴리오

```http
GET /api/quant/models/{modelCode}/signals?date=20260520
POST /api/quant/models/{modelCode}/signals/generate?date=20260520
GET /api/quant/models/{modelCode}/portfolio?date=20260520
POST /api/quant/models/{modelCode}/rebalance?date=20260520
```

---

## 7. 구현 우선순위

| 단계 | 작업 | 이유 |
|---|---|---|
| 1 | `quant_model` 리소스와 5개 모델 seed | 모델 관리 구조 확정 |
| 2 | `horizon`, `riskProfile`, `dataReadiness` 필드 추가 | 단기/중기/장기, 위험형/안정형 분류를 API에서 바로 지원 |
| 3 | MP-DM 구현 | 가격 데이터만으로 가능하고 검증 난도 낮음 |
| 4 | MP-PEAD MVP 구현 | 5번째 단기 모델. 우선 가격 반응 proxy로 시작 |
| 5 | MP-CF MVP 구현 | 저변동성 + 모멘텀까지는 가격 데이터로 가능 |
| 6 | 재무/실적 데이터 적재 설계 | MP-MF, MP-PF, MP-PEAD 정식 구현의 필수 선행 작업 |
| 7 | MP-MF / MP-PF 구현 | 장기 위험형/안정형 완성 |
| 8 | MP-STR 후보 검증 | 단기 안정형까지 채워 6개 모델 체계 완성 |

---

## 8. 수용 기준

- `GET /api/quant/models`가 우선 5개 모델을 반환한다.
- 각 모델은 공개 성과 출처, 데이터 요구사항, 투자 기간, 위험 성향, 활성 상태, 기본 파라미터를 가진다.
- `horizon=SHORT|MID|LONG`, `riskProfile=AGGRESSIVE|DEFENSIVE` 필터가 가능해야 한다.
- 모델별 백테스트는 기존 전략 단위가 아니라 `modelCode` 기준으로 실행된다.
- MP-DM은 KRX/ETF/지수 가격 데이터만으로 신호 생성이 가능하다.
- MP-PEAD는 컨센서스/실적발표 데이터 미적재 상태에서 `PARTIAL_READY` 또는 `DATA_REQUIRED` 상태를 반환한다.
- MP-MF와 MP-PF는 재무 데이터 미적재 상태에서 `DATA_REQUIRED` 상태를 반환한다.
- 프론트에서는 모델별 카드, 공개 성과, 로컬 백테스트 성과, 데이터 준비 상태, 투자 기간/성향을 구분해서 보여준다.

---

## 9. 참고 자료

- Joel Greenblatt Magic Formula 원 백테스트 요약: https://www.fool.com/investing/general/2011/07/01/a-foolish-view-of-a-magic-formula.aspx
- Magic Formula + Momentum 확장: https://www.quant-investing.com/strategies/magic-formula-investing-and-momentum
- Piotroski F-Score 논문 PDF: https://www.anderson.ucla.edu/sites/default/files/documents/areas/prg/asam/2019/F-Score.pdf
- Gary Antonacci GEM 성과 요약: https://svrn.co/blog/2015/8/2/is-gary-antonaccis-global-equity-momentum-strategy-robust
- Conservative Formula SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3145152
- PEAD / Earnings Surprise Drift SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=909563
- Short-Term Reversal 최신 연구: https://www.sciencedirect.com/science/article/pii/S0927539825000301
- Value and Momentum Everywhere 관련 AQR 자료: https://www.aqr.com/search?Topics=Momentum
- Factor Momentum Everywhere SSRN: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3300728

---

## 10. 유료 데이터 비용 메모

현재 연결된 KRX/KIS 무료 데이터만으로는 가격, 거래량, 시가총액 기반 모델은 구현 가능하지만, 재무제표·컨센서스·실적 발표 캘린더가 필요한 모델은 외부 유료 데이터 또는 DART 가공 파이프라인이 필요하다.

### 유료가 필요한 데이터

| 데이터 | 필요한 모델 | 유료 후보 | 공개/확인 가격 |
|---|---|---|---:|
| 표준화 재무제표, 재무비율, 주당지표, 배당지표 | MP-MF, MP-PF, MP-CF 완성형 | FnSpace 재무 API | 50,000원/월부터 |
| 컨센서스, 목표주가, 추정실적, Forward 지표 | MP-PEAD 정식 구현 | FnSpace 컨센서스 API | 70,000원/월부터 |
| 웹 기반 컨센서스 조회 | MP-PEAD 리서치/수동 확인 | FnConsensus | 165,000원/월 |
| 웹 기반 재무/주식/기업 데이터 조회 | MP-MF, MP-PF 리서치/수동 확인 | FnDB Navigator | 165,000원/월 |
| 종합 단말/전문가용 데이터 | 전체 대체 가능 | Koscom CHECK Expert+ | 436,000원/월 + 옵션 |

### 최소 비용 시나리오

| 목적 | 구성 | 월 비용 |
|---|---|---:|
| 재무 모델만 구현 | FnSpace 재무 | 50,000원/월 |
| PEAD 정식 구현 | FnSpace 재무 + 컨센서스 | 120,000원/월 |
| 5개 모델 완성형에 가까운 구성 | FnSpace 재무 + 컨센서스 | 120,000원/월 |
| 웹 조회형으로만 확인 | FnDB Navigator + FnConsensus | 330,000원/월 |
| 전문 단말 기반 | CHECK Expert+ 기본 + 기업정보/컨센서스 옵션 | 약 636,000원/월 이상 |

### 라이선스 주의

- FnSpace API는 가격이 낮지만 개인/내부/연구 목적 중심으로 확인된다.
- 데이터를 서비스 화면에 재배포하거나 고객에게 제공하는 경우 기업 고객 라이선스 별도 문의가 필요하다.
- DART는 무료지만 원천 재무제표를 직접 수집·정규화·시점 관리해야 하므로 구현 비용이 크다.
- 현재 무료 API로 바로 구현 가능한 모델은 MP-DM, MP-STR 후보이며, MP-CF는 저변동성+모멘텀 MVP까지만 가능하다.

### 출처

- FnSpace 요금: https://testfnapi.fnguide.com/Customer/Info
- FnGuide 이용권: https://www.fnguide.com/Payment/Purchase
- Koscom CHECK Expert+: https://www.check.co.kr/
