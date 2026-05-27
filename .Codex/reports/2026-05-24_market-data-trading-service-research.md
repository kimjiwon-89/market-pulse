# 주식 데이터·트레이딩 정보 확장 리서치

> 작성일: 2026-05-24  
> 목적: Market Pulse가 토스증권 수준의 종목 정보 화면과 퀀트 입력 데이터를 갖추기 위해 필요한 공개/오픈소스/제휴 데이터 소스, 차트 수집 방식, 공시·리포트 수집 전략을 정리한다.

## 0. 결론

현재 Market Pulse는 종목 기본 정보와 일부 KIS/KRX 기반 조회에 머물러 있다. 토스증권 수준으로 가려면 단순한 "종목 상세"가 아니라 아래 6개 데이터 축을 모두 갖춘 종목 터미널로 확장해야 한다.

| 축 | 핵심 데이터 | 1차 소스 | 구현 판단 |
|---|---|---|---|
| 실시간·분봉 시세 | 현재가, 1분봉, 체결, 호가, 예상체결, VI | KIS Open API | 바로 가능. 단, 과거 1분봉은 장중 저장 필수 |
| 일봉·기본 시장 데이터 | OHLCV, 거래대금, 종목 마스터, 지수, ETF/ETN | KRX Open API + KIS | 바로 가능. KRX는 2010년 이후 EOD 중심 |
| 수급·거래현황 | 개인/외국인/기관, 거래원, 프로그램, 공매도, 신용, 대차 | KIS + KRX EOD | 대부분 가능. CFD 세부 데이터는 공개성 낮음 |
| 공시·회사 제출 보고서 | DART 원문, XBRL, 정기/수시/지분/주요사항/증권신고서 | OpenDART + KIND 링크 | 바로 가능. 원문 XML·XBRL 저장 가능 |
| 뉴스·애널리스트·기관 리포트 | 뉴스, 증권사 리포트, 목표주가, 컨센서스, IR 자료 | KIS 뉴스제목, Naver Search, FnGuide/WiseReport, KIRS | 메타데이터/링크는 가능. 전문 저장은 라이선스 확인 필요 |
| 화면·UX | 고성능 캔들차트, 지표, 관심종목, 알림, AI 요약 | Lightweight Charts + 자체 API | Recharts보다 금융 차트 전용 라이브러리 필요 |

가장 중요한 제약은 1분봉이다. KIS `주식당일분봉조회`는 공식 샘플 기준으로 TR ID `FHKST03010200`, URL `/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice`를 사용하지만, 당일 분봉만 제공하고 1회 호출 최대 30건이다. 따라서 과거 1분봉을 보려면 장중에 직접 분봉을 저장하는 파이프라인이 필요하다. 전일·과거 전체 1분봉을 한번에 백필하려면 KRX/Koscom 데이터 분배 상품 또는 유료 데이터 벤더를 검토해야 한다.

## 1. 토스증권 벤치마크

직접 전달받은 토스증권 스크린샷과 `https://www.tossinvest.com/stocks/A005930/analytics` 링크를 기준으로 정리했다. 웹 fetch에서는 토스 페이지가 "지원하지 않는 브라우저" 화면만 반환되어, 실제 기능 식별은 스크린샷을 1차 근거로 삼았다.

### 1.1 종목 상단 요약

| 화면 요소 | 설명 | Market Pulse 데이터 소스 후보 |
|---|---|---|
| 현재가·전일대비·등락률 | 실시간 또는 지연 현재가 | KIS `inquire-price`, WebSocket 체결 |
| 1일 범위, 52주 범위 | 당일 고저가, 52주 고저가 | KIS 현재가 + KRX/KIS 일봉 캐시 |
| 거래대금 순위 | 시장 내 거래대금 랭킹 | KIS ranking/volume API, KRX EOD |
| 체결강도 | 매수/매도 체결 강도 | KIS `volume-power` |
| 외국인 순매수/순매도 순위 | 외국인 수급 랭킹 | KIS 외국인/기관 집계 |
| 기관 수급 요약 | 기관 매매 흐름 | KIS 투자자 매매동향 |
| 알림·관심 버튼 | 사용자 개인화 | 자체 DB |

### 1.2 차트·호가 화면

| 기능 | 토스 화면 기준 | 구현 방향 |
|---|---|---|
| 캔들 차트 | 1분, 일, 주, 월, 년 | 1분은 KIS 당일분봉 + 자체 저장, 일/주/월/년은 KIS 기간별시세 |
| 이동평균 | 5, 20, 60, 120 | 프론트/백엔드 계산 가능 |
| 거래량 패널 | 캔들 하단 거래량 | 분봉/일봉 저장 데이터 |
| 확대/설정/도구 | 전체화면, 설정, 드로잉 아이콘 | `lightweight-charts` 우선 검토 |
| 호가 | 로그인 필요 화면 | KIS 호가/예상체결 + WebSocket 호가 |
| 체결 | 실시간 체결가/체결량 | KIS 실시간 체결 WebSocket |

### 1.3 종목정보 화면

| 하위 탭 | 포함 데이터 | 소스 후보 |
|---|---|---|
| 주요 정보 | 회사 개요, 대표, 상장일, 발행주식수, 시총, 기업가치 | KIS 기본조회, DART 기업개황, KRX 종목기본정보 |
| 재무 | 손익계산서, 재무상태표, 재무비율 | OpenDART XBRL/재무제표 + KIS finance APIs |
| 실적 | 매출/영업이익/순이익 추이, 추정실적 | OpenDART 확정치 + KIS `estimate-perform` + FnGuide 제휴 |
| 배당 | 배당금, 배당수익률, 배당성향 | DART, KIS `dividend-rate`, KSD 배당 관련 API |
| 동종 업계 비교 | 피어 PER/PBR/수익률/시총 비교 | KRX 업종 + KIS 재무/시세, FnGuide 제휴 시 고도화 |
| 애널리스트 분석 | 투자의견, 목표주가, 컨센서스 | KIS `invest-opinion`, FnGuide/WiseReport 제휴 |

### 1.4 뉴스·공시 화면

| 기능 | 구현 방향 |
|---|---|
| 종목 뉴스 | KIS `news-title`은 제목 중심. 본문/이미지는 Naver Search API, 언론사 RSS/API, BIG KINDS, 제휴 검토 |
| 공시 목록 | OpenDART 공시검색 + KIND 링크 |
| 공시 원문 | OpenDART 공시서류 원본 XML 다운로드 |
| 중요 공시 알림 | 공시 유형 코드 기반 이벤트 태깅 |

### 1.5 거래현황 화면

| 기능 | 토스 화면 기준 | 구현 가능성 |
|---|---|---|
| 거래원 매매 상위 | 매수/매도 상위 5개 증권사 | KIS 회원사 매매동향/실시간회원사 |
| 투자자별 매매 동향 | 개인, 외국인, 기관 일별/주별 그래프 | KIS 투자자매매동향 |
| 프로그램 매매 | 순매수/매수/매도 | KIS program trade APIs |
| 신용거래 | 신용잔고/융자/대주 | KIS credit APIs, KRX/KSD 보조 |
| 대차거래 | 대차 잔고/상환 | KIS loan/lendable APIs 일부, KRX/KSD 보조 |
| 공매도 | 공매도 일별 추이 | KIS `daily-short-sale`, KRX EOD |
| CFD | 토스 화면에 탭 존재 | 종목별 공개 데이터 제한. 공식 공개 범위 재확인 필요 |

## 2. 데이터 소스 지도

### 2.1 KIS Open API: 실시간·트레이딩형 데이터의 1순위

현재 프로젝트가 이미 KIS를 쓰고 있으므로, 토스형 화면의 대부분은 KIS 확장으로 가장 빨리 붙일 수 있다.

| 기능군 | KIS API/샘플명 | 주요 TR ID 또는 URL | 비고 |
|---|---|---|---|
| 현재가 | `inquire_price` | `FHKST01010100` | 현재가, 등락률, 거래량 등 |
| 1분봉 | `inquire_time_itemchartprice` | `FHKST03010200`, `/quotations/inquire-time-itemchartprice` | 당일 분봉만 제공, 호출당 최대 30건 |
| 일/주/월/년 차트 | `inquire_daily_itemchartprice` | `FHKST03010100`, `/quotations/inquire-daily-itemchartprice` | 기간별 OHLCV |
| 호가/예상체결 | `inquire_asking_price_exp_ccn` | `FHKST01010200`, `/quotations/inquire-asking-price-exp-ccn` | 실시간은 WebSocket 권장 |
| 투자자 매매 | `inquire_investor`, `investor_trade_by_stock_daily` | `FHKST01010900`, `FHPTJ04160001` | 개인/외국인/기관 수급 |
| 거래원 | `inquire_member_daily`, `member_krx` | `FHPST04540000`, WebSocket `H0STMBC0` | 거래원 매수/매도 상위 |
| 공매도 | `daily_short_sale`, `short_sale` | `FHPST04830000` 등 | 일별 공매도 추이 |
| 프로그램 | `program_trade_by_stock_daily`, `comp_program_trade_daily` | KIS sample catalog | 종목/시장 프로그램 수급 |
| 신용·대차 | `credit_balance`, `daily_credit_balance`, `daily_loan_trans` | KIS sample catalog | 토스 거래현황 탭 후보 |
| VI | `inquire_vi_status` | `FHPST01390000` | 변동성완화장치 현황 |
| 체결강도 | `volume_power` | `FHPST01680000` | 체결강도 상위/스코어 |
| 뉴스 제목 | `news_title` | `FHKST01011800`, `/quotations/news-title` | 제목 중심, 본문은 별도 소스 필요 |
| 재무제표/비율 | `finance_income_statement`, `finance_balance_sheet`, `finance_financial_ratio` | `FHKST66430200`, `FHKST66430300` 등 | 확정 재무 데이터 보조 |
| 추정실적 | `estimate_perform` | `HHKST668300C0` | 애널리스트 추정치 성격. 라이선스/출처 확인 필요 |
| 투자의견 | `invest_opinion` | `FHKST663300C0` | 목표가/의견 데이터. 제휴성 데이터 여부 확인 필요 |

주의:
- KIS REST 호출 제한을 고려해야 한다. 종목 전체 분봉 수집은 REST만으로는 부하가 크므로 WebSocket 체결 수신 후 서버에서 1분봉으로 집계하는 방식이 더 안정적이다.
- 주문 API는 존재하지만 Market Pulse는 실제 거래를 하지 않으므로 주문/정정/취소 API는 사용하지 않는다. 화면에는 "모의 주문/관찰용 주문 패널" 정도만 둔다.

### 2.2 KRX Open API: 공식 EOD·종목 마스터·지수 데이터

KRX Open API는 2010년 이후 데이터 중심의 일별 데이터에 강하다. 실시간·분봉보다는 배치/검증/백테스트용 기준 데이터로 써야 한다.

| 영역 | 제공 데이터 | 적용 |
|---|---|---|
| 주식 일별매매정보 | 유가, 코스닥, 코넥스 일별 OHLCV/거래대금 | `market_daily_price` 공식 기준 데이터 |
| 종목기본정보 | 유가, 코스닥, 코넥스 종목 기본정보 | `stock_master` 갱신 |
| 지수 | KRX/KOSPI/KOSDAQ/채권/파생 지수 | 벤치마크/시장 국면 |
| ETF/ETN/ELW | 증권상품 일별매매정보 | ETF/테마 확장 |
| 채권·파생·금·배출권 | 일반상품/파생/채권 일별정보 | 향후 매크로·대체자산 |

KRX는 실시간 데이터 분배 상품도 제공하지만, 이는 무료 Open API와 다른 데이터 분배/라이선스 영역이다. 실시간 항목에는 체결가, 호가, 프로그램매매, 공매도, 외국인거래, 회원사매수매도 등이 포함되며, 종가 데이터는 별도 전송 시간 기준이 있다. 과거 분봉/틱/호가를 안정적으로 확보하려면 이 영역 또는 Koscom/데이터 벤더 계약을 검토해야 한다.

### 2.3 OpenDART: 회사 제출 보고서의 기준 소스

"회사에서 제출하는 보고서 전부"는 OpenDART를 기준으로 설계해야 한다.

| 데이터 | OpenDART 기능 | 적용 |
|---|---|---|
| 공시 목록 | 공시검색 | 종목별 공시 탭, 공시 이벤트 피처 |
| 기업 개황 | 기업개황 | 회사 기본정보 보강 |
| 원문 | 공시서류 원본파일 | XML 원문 다운로드, 본문 검색/요약 |
| 고유번호 | 고유번호 파일 | stock code ↔ corp code 매핑 |
| 정기보고서 주요정보 | 사업보고서 주요항목 | 배당, 임원, 최대주주 등 이벤트 피처 |
| 재무정보 | 단일회사 주요계정, 전체 재무제표, XBRL 원본 | 확정 재무 팩터 |
| 지분공시 | 지분공시 종합정보 | 대주주/임원 지분 변화 |
| 주요사항보고서 | 유상증자, 전환사채, 합병 등 | 이벤트 드리븐 퀀트 피처 |
| 증권신고서 | 증권신고서 주요정보 | IPO/증자/채권 발행 이벤트 |

OpenDART 원문은 XML/XBRL 형태로 받을 수 있으므로, 화면에는 원문 링크와 주요 표 추출/요약을 같이 제공하는 것이 좋다. 단, DART도 제출인이 작성한 공시자료를 제공하는 것이며 금융감독원이 정확성·완전성을 보장하지 않는다는 고지가 있다. 정정공시 반영과 point-in-time 저장이 필수다.

### 2.4 KIND: 거래소 공시·IR 자료 보조

KIND는 한국거래소 기업공시 채널이다. 오늘의 공시, 회사별 검색, 통합검색, IR일정/IR자료실, 기업분석보고서, 상장법인 목록, 기업 밸류업 자료 등을 제공한다.

적용 방향:
- OpenDART가 공식 API 중심의 1차 소스다.
- KIND는 IR 일정/IR 자료실, 거래소 공시 UI 링크, 상장법인 상세정보 보조로 둔다.
- 안정적인 공식 API가 확인되지 않는 영역은 무리한 크롤링보다 링크/메타데이터 중심으로 시작한다.

### 2.5 뉴스

| 소스 | 장점 | 한계 | 적용 |
|---|---|---|---|
| KIS `news_title` | 종목코드 기반 제목 조회가 쉬움 | 제목 중심, 본문/이미지 부족 | 종목 뉴스 리스트 1차 |
| NAVER Search API | 뉴스 검색 API 공식 제공, 일 25,000 처리한도 안내 | 검색결과 제공이지 기사 전문 DB가 아님 | 링크/제목/요약 리스트 |
| BIG KINDS | 뉴스 빅데이터 분석에 강함 | 사용 조건/제휴 범위 확인 필요 | 감성/이슈 분석 후보 |
| 언론사 RSS/API | 원문 출처 명확 | 매체별 제약 | 중요 매체 보강 |

뉴스 본문 전문 저장은 저작권 리스크가 크다. 제목, URL, 발행시각, 언론사, 짧은 자체 요약, 종목 매핑, 감성/이벤트 태그 중심으로 저장하는 것이 안전하다.

### 2.6 애널리스트·기관 리포트

| 소스 | 데이터 | 판단 |
|---|---|---|
| FnGuide / FnResearch / FnConsensus / WiseReport | 증권사 리포트, 목표주가, 투자의견, 실적 추정치, 컨센서스 | 토스 수준 애널리스트 분석의 핵심 후보. 유료/저작권/재배포 계약 필요 |
| KIS `invest-opinion`, `estimate-perform` | 종목투자의견, 종목추정실적 | 구현은 쉬움. 데이터 원천/재배포 조건 확인 필요 |
| 한국IR협의회 기업리서치센터 | 중소형주 리포트, AI 기업분석보고서, 기술분석보고서 | 무료 공개 자료가 많지만 API 여부 확인 필요. 링크/메타부터 시작 |
| 각 증권사 리서치센터 | PDF 리포트 | 공개 PDF라도 저작권 존재. 전문 저장/재배포는 계약 필요 |
| 정부/공공/협회/연구소 | 산업·경제·정책 보고서 | 종목 직접 매핑은 NLP 필요 |

"기관이나 애널리스트 등이 퍼블릭으로 제출하는 보고서 전부"는 기술보다 권리 문제가 크다. 모든 PDF를 우리 DB에 복제하는 방식은 피하고, 우선은 `report_document`에 메타데이터·원문 URL·발행기관·종목태그·요약·임베딩만 저장한다. 전문 저장은 명시 라이선스가 있는 소스 또는 계약된 소스만 허용한다.

## 3. 오픈소스·라이브러리 후보

| 라이브러리 | 용도 | 장점 | 한계 | 적용 판단 |
|---|---|---|---|---|
| FinanceDataReader | KRX/해외 종목 목록, 가격, 지수, 환율, 암호화폐 | 빠른 리서치/검증에 좋음 | 크롤러 성격, 실시간·분봉 한계 | 배치 검증/프로토타입 |
| pykrx | KRX/Naver 기반 한국 주식 데이터 | OHLCV, 투자자, 공매도, ETF 등 폭넓음 | KRX 정책 변경 영향, 2026 릴리스에서 로그인/세션 대응 언급 | Python 리서치/백필 보조 |
| OpenDartReader | OpenDART Python 래퍼 | DART 공시/재무 조회 편리 | Java 백엔드와 직접 통합은 별도 작업 | 수집 스크립트 후보 |
| yfinance | Yahoo Finance 데이터 | 해외 주식/ETF, 일부 intraday | Yahoo 비공식, 한국 데이터 신뢰성/지연 이슈 | 해외 보조, 국내 핵심 금지 |
| KIS open-trading-api | 한국투자증권 공식 샘플 코드 | API 이름/파라미터/응답 확인에 유용 | 그대로 서비스 런타임으로 쓰기보다 참고용 | API 구현 레퍼런스 |

## 4. 차트 라이브러리 후보

현재 프론트엔드는 Recharts를 쓰고 있지만, 1분봉/실시간 캔들/호가/기술지표/마커까지 가면 금융 차트 전용 라이브러리가 맞다.

| 라이브러리 | 장점 | 한계 | 판단 |
|---|---|---|---|
| TradingView Lightweight Charts | Apache 2.0, 오픈소스, 캔들/라인/히스토그램, 실시간 업데이트, 고성능 | TradingView 전체 차팅 플랫폼과는 다름. 드로잉 도구는 직접 구현 필요 | 1순위 |
| Apache ECharts | Apache 2.0, 다양한 차트, candlestick 지원 | 금융 터미널 UX는 직접 구성 필요 | 보조/대시보드용 |
| Recharts | 이미 사용 중, React 친화적 | 고빈도 캔들/실시간 금융차트에는 약함 | 랭킹/요약 차트 유지 |

추천:
- 종목 차트: `lightweight-charts`
- 퀀트 대시보드/분포/성과: Recharts 또는 ECharts
- 장기적으로 주문북/체결창/분봉 동기화가 필요하면 Canvas 기반 직접 최적화 고려

## 5. 1분봉 수집 설계

### 5.1 즉시 구현 가능한 방식

1. 종목 상세 화면에서 사용자가 요청한 종목의 당일 1분봉을 KIS `inquire-time-itemchartprice`로 조회한다.
2. 최신 30개 분봉만 바로 표시하고, 이전 분봉은 시간 파라미터를 이동하며 추가 조회한다.
3. 호출 결과를 `stock_minute_bar`에 upsert한다.
4. 장중에는 WebSocket 체결 수신으로 1분 OHLCV를 서버에서 직접 집계한다.

### 5.2 과거 1분봉 확보 방식

| 방식 | 장점 | 한계 |
|---|---|---|
| 장중 자체 저장 | 무료 API 기반, 우리 데이터가 point-in-time으로 쌓임 | 시작일 이전 과거 분봉은 없음 |
| KIS 당일분봉 반복 조회 | 구현 빠름 | 당일만 가능, 호출 제한 부담 |
| WebSocket 체결 집계 | 가장 안정적, 실시간 차트에 적합 | 서버 상시 실행/장애 복구 필요 |
| KRX/Koscom/벤더 계약 | 과거 분봉/틱까지 가능 | 비용/계약/라이선스 |

### 5.3 제안 테이블

```sql
CREATE TABLE stock_minute_bar (
    code          VARCHAR(10) NOT NULL,
    market        VARCHAR(10) NOT NULL,
    bar_time      TIMESTAMP   NOT NULL,
    open_price    NUMERIC     NOT NULL,
    high_price    NUMERIC     NOT NULL,
    low_price     NUMERIC     NOT NULL,
    close_price   NUMERIC     NOT NULL,
    volume        NUMERIC     NOT NULL,
    trade_amount  NUMERIC,
    source        VARCHAR(20) NOT NULL, -- KIS_REST | KIS_WS | VENDOR
    collected_at  TIMESTAMP   DEFAULT NOW(),
    PRIMARY KEY (code, bar_time, source)
);

CREATE INDEX idx_stock_minute_bar_code_time
    ON stock_minute_bar (code, bar_time DESC);
```

추가로 호가/체결 데이터는 원천 틱을 모두 저장하면 용량이 커진다. MVP에서는 1분 단위 스냅샷과 분봉 집계부터 저장하고, 틱 원장은 관심종목/상위 거래대금 종목만 제한 저장하는 것이 현실적이다.

## 6. 공시·보고서 수집 설계

### 6.1 DART 공시

```sql
CREATE TABLE disclosure_document (
    rcept_no        VARCHAR(20) PRIMARY KEY,
    corp_code       VARCHAR(20) NOT NULL,
    stock_code      VARCHAR(10),
    corp_name       VARCHAR(100) NOT NULL,
    report_name     VARCHAR(300) NOT NULL,
    report_type     VARCHAR(50),
    submitted_at    TIMESTAMP,
    source_url      TEXT,
    raw_xml_path    TEXT,
    parsed_json     JSONB,
    event_tags      TEXT[],
    collected_at    TIMESTAMP DEFAULT NOW()
);
```

수집 단계:
1. `corp_code` 전체 파일을 받아 종목코드와 매핑한다.
2. 공시검색으로 종목별 신규 공시를 주기적으로 수집한다.
3. 원문 XML/XBRL을 내려받고, 원문 파일은 object storage 또는 로컬 스토리지에 저장한다.
4. 주요 항목을 `parsed_json`으로 구조화한다.
5. `정정`, `주요사항`, `지분`, `증권신고서`, `잠정실적`, `무상증자`, `유상증자`, `CB/BW`, `합병`, `분할`, `소송`, `조회공시` 같은 이벤트 태그를 생성한다.

### 6.2 애널리스트·기관 리포트

```sql
CREATE TABLE research_report (
    id              BIGSERIAL PRIMARY KEY,
    stock_code      VARCHAR(10),
    title           VARCHAR(500) NOT NULL,
    publisher       VARCHAR(100),
    analyst         VARCHAR(100),
    published_at    TIMESTAMP,
    report_type     VARCHAR(50), -- COMPANY | INDUSTRY | MACRO | STRATEGY | IR | TECH
    source_name     VARCHAR(50), -- FnGuide | KIRS | Broker | KIND | CompanyIR
    source_url      TEXT NOT NULL,
    license_status  VARCHAR(30) NOT NULL, -- LINK_ONLY | LICENSED | PUBLIC_PERMISSIVE | UNKNOWN
    summary         TEXT,
    target_price    NUMERIC,
    opinion         VARCHAR(50),
    tickers         TEXT[],
    event_tags      TEXT[],
    collected_at    TIMESTAMP DEFAULT NOW()
);
```

원칙:
- `LINK_ONLY`: 공개 PDF라도 전문 저장/재배포 금지. 링크와 자체 요약만 저장.
- `LICENSED`: FnGuide/WiseReport 등 계약 후 전문/컨센서스 저장.
- `PUBLIC_PERMISSIVE`: 명시적으로 재사용 가능한 공공자료만 전문 저장.
- `UNKNOWN`: 수동 검토 전에는 표시만 하고 요약/다운로드 금지.

## 7. 토스증권급 기능 커버리지 매트릭스

| 기능 | 구현 우선순위 | 1차 소스 | 비고 |
|---|---:|---|---|
| 현재가/등락률/거래량 | P0 | KIS | 이미 일부 있음 |
| 1분봉 차트 | P0 | KIS + 자체 저장 | 당일 API + WebSocket 집계 |
| 일/주/월/년 차트 | P0 | KIS/KRX | KRX는 EOD 기준 |
| 호가/예상체결 | P0 | KIS | 로그인 없이 조회 화면 제공 가능 |
| 체결 목록 | P0 | KIS WebSocket | 실시간 패널 |
| 거래원 매매 상위 | P0 | KIS | Toss 거래현황 핵심 |
| 투자자별 매매 동향 | P0 | KIS | 기존 investor 도메인 확장 |
| 프로그램 매매 | P1 | KIS | 단기 수급 팩터 |
| 신용거래/대차 | P1 | KIS/KRX/KSD | 데이터 정의 확인 필요 |
| 공매도 | P1 | KIS/KRX | 공매도 재개/제도 변경 주의 |
| 회사 개요/상장정보 | P0 | KIS/KRX/DART | 종목정보 탭 |
| 재무제표/재무비율 | P1 | OpenDART + KIS | 확정치 중심 |
| 실적/컨센서스 | P1/P2 | KIS + FnGuide | 정확한 컨센서스는 제휴 권장 |
| 배당 | P1 | DART/KIS/KSD | 배당 히스토리 |
| 동종업계 비교 | P1 | KRX 업종 + KIS/KRX | 피어 그룹 정의 필요 |
| 애널리스트 분석 | P2 | KIS/FnGuide/WiseReport/KIRS | 라이선스 이슈 |
| 뉴스 | P1 | KIS/Naver/BIG KINDS | 본문 저장 주의 |
| 공시 | P0 | OpenDART/KIND | 원문 XML 가능 |
| 관심종목 TOP10 | P1 | 자체 DB | 익명 집계 가능 |
| 알림 | P1 | 자체 DB + 이벤트 엔진 | 가격/공시/뉴스/리포트 |
| Toss AI 유사 요약 | P2 | 뉴스+공시+리포트+LLM | 근거 링크 필수 |
| 커뮤니티 | P3 | 자체 기능 | 신고/운영 정책 필요 |
| 주문 패널 | 제외/P3 | 자체 모의 UI | 실제 주문 금지 |

## 8. 퀀트 적용 아이디어

### 8.1 가격·거래량·분봉 팩터

| 피처 | 설명 | 원천 |
|---|---|---|
| intraday_return_5m/30m/1d | 장중 단기 수익률 | `stock_minute_bar` |
| intraday_volatility | 장중 실현변동성 | 1분봉 |
| volume_spike_ratio | 평소 대비 거래량 급증 | 1분봉 + 일봉 |
| trade_amount_rank | 거래대금 순위 | KIS/KRX |
| close_location_value | 종가가 고가/저가 중 어디에 위치하는지 | 일봉/분봉 |

### 8.2 수급·거래현황 팩터

| 피처 | 설명 | 원천 |
|---|---|---|
| foreign_net_buy_1d/5d/20d | 외국인 누적 순매수 | KIS 투자자매매 |
| institution_net_buy_1d/5d/20d | 기관 누적 순매수 | KIS 투자자매매 |
| member_buy_concentration | 특정 거래원 매수 집중도 | KIS 거래원 |
| program_net_buy | 프로그램 순매수 | KIS 프로그램 |
| short_sale_ratio | 공매도 비중 | KIS/KRX |
| credit_balance_change | 신용잔고 변화 | KIS/KRX |

### 8.3 공시·뉴스·리포트 이벤트 팩터

| 피처 | 설명 | 원천 |
|---|---|---|
| disclosure_event_type | 증자, CB, 합병, 잠정실적 등 이벤트 태그 | DART |
| disclosure_surprise_score | 실적/가이던스/정정 영향 점수 | DART + NLP |
| news_sentiment_score | 뉴스 감성/이슈 점수 | 뉴스 API + LLM |
| report_revision_score | 목표가/투자의견/추정치 변화 | KIS/FnGuide |
| report_coverage_count | 최근 N일 리포트 수 | KIRS/FnGuide/증권사 |

주의:
- 공시/리포트/뉴스는 반드시 `published_at`, `collected_at`, `available_at`을 분리해야 한다.
- 백테스트는 실제 그 시점에 알 수 있었던 데이터만 사용해야 한다. 정정공시·리포트 사후 업데이트를 현재 기준으로 덮어쓰면 look-ahead bias가 생긴다.
- 리포트 전문 기반 NLP는 저작권/계약이 해결된 소스만 사용한다.

## 9. 권장 구현 로드맵

### P0: 토스형 종목 터미널의 뼈대

1. `lightweight-charts` 도입
2. KIS 1분봉/일봉/현재가/호가 API 확장
3. `stock_minute_bar`, `stock_orderbook_snapshot`, `stock_trade_tick_agg` 테이블 설계
4. OpenDART 공시검색 + 원문 XML 다운로드
5. 종목 상세 탭을 `차트·호가 / 종목정보 / 뉴스·공시 / 거래현황` 구조로 재편

### P1: 데이터 깊이 확장

1. KRX EOD 배치로 일봉 기준 데이터 정합성 확보
2. 거래원/투자자/프로그램/공매도/신용/대차 수급 저장
3. OpenDART XBRL 재무제표 파싱
4. KIS 뉴스제목 + NAVER Search API 뉴스 링크 통합
5. 관심종목/알림/최근 본 종목 구현

### P2: 리포트·컨센서스·AI

1. KIS 투자의견/추정실적 데이터 원천 및 재배포 조건 확인
2. FnGuide/WiseReport 제휴 견적 및 범위 확인
3. KIRS 보고서 메타데이터 수집 및 링크 제공
4. 공시/뉴스/리포트 기반 종목 AI 요약
5. 퀀트 feature store에 이벤트/수급/분봉 피처 연결

### P3: 고도화

1. 과거 분봉/틱 벤더 계약 검토
2. 실시간 시장 스캐너
3. 커뮤니티/토론
4. 종목·섹터·테마 그래프
5. 리포트 원문 검색/근거 기반 Q&A

## 10. 리스크와 트레이드오프

| 이슈 | 리스크 | 대응 |
|---|---|---|
| 1분봉 과거 데이터 | KIS는 당일분봉 중심이라 과거 백필 불가 | 장중 저장 + 유료 벤더 검토 |
| API 호출 제한 | 전종목 실시간 REST 폴링 불가 | WebSocket, 관심종목 우선, 캐시 |
| 리포트 저작권 | 공개 PDF라도 재배포 금지 가능 | 링크/메타/요약 중심, 계약 후 전문 저장 |
| 뉴스 저작권 | 기사 본문 저장/재배포 리스크 | 제목/링크/짧은 자체 요약 |
| 컨센서스 데이터 | FnGuide 성격 데이터는 유료 가능성 높음 | KIS 데이터 조건 확인 + 제휴 검토 |
| DART 정정공시 | 과거 수치 변경 가능 | 버전 저장, point-in-time 백테스트 |
| 분봉 저장 용량 | 전종목 1분봉 장기 저장 시 용량 증가 | 압축/파티셔닝/관심종목 우선 |
| 실제 거래 UI | 사용자가 거래 가능하다고 오해할 수 있음 | 주문 기능 제외, 모의/교육 UI만 표시 |

## 11. 바로 다음 액션

1. KIS `inquire-time-itemchartprice`로 삼성전자 1분봉 응답 필드 실측
2. `lightweight-charts` 프로토타입 화면 1개 제작
3. OpenDART API 키/호출 제한 확인 후 공시검색 샘플 수집
4. KIS 샘플 catalog에서 현재 프로젝트에 필요한 API 30개를 선별해 백엔드 도메인 설계
5. FnGuide/WiseReport/KIS 투자의견 데이터의 재배포 가능 범위를 확인

## 12. 참고 출처

- Toss Securities 종목 화면: https://www.tossinvest.com/stocks/A005930/analytics
- KIS Open API 개발자센터: https://apiportal.koreainvestment.com/
- KIS 공식 샘플 저장소: https://github.com/koreainvestment/open-trading-api
- KIS 1분봉 샘플: https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/inquire_time_itemchartprice/inquire_time_itemchartprice.py
- KIS 기간별 차트 샘플: https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/inquire_daily_itemchartprice/inquire_daily_itemchartprice.py
- KIS 호가/예상체결 샘플: https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/inquire_asking_price_exp_ccn/inquire_asking_price_exp_ccn.py
- KIS 뉴스제목 샘플: https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/news_title/news_title.py
- KIS 종목투자의견 샘플: https://raw.githubusercontent.com/koreainvestment/open-trading-api/main/examples_llm/domestic_stock/invest_opinion/invest_opinion.py
- KRX Open API 서비스 목록: https://openapi.krx.co.kr/contents/OPP/INFO/service/OPPINFO004.cmd
- KRX 데이터 분배상품: https://openapi.krx.co.kr/contents/OPP/DATA/OPPDATA002.jsp
- OpenDART 소개: https://opendart.fss.or.kr/intro/main.do
- OpenDART 공시정보 개발가이드: https://opendart.fss.or.kr/guide/main.do?apiGrpCd=DS001
- OpenDART 정기보고서 재무정보 개발가이드: https://opendart.fss.or.kr/guide/main.do?apiGrpCd=DS003
- KIND 기업공시채널: https://kind.krx.co.kr/
- FnGuide: https://www.fnguide.com/
- FnGuide 리포트 제공사 안내: https://help-fnguide.fnguide.com/ko/articles/%EB%A6%AC%ED%8F%AC%ED%8A%B8-%EC%A0%9C%EA%B3%B5%EC%82%AC-%EB%B0%8F-%EC%97%85%EB%8D%B0%EC%9D%B4%ED%8A%B8-bdc95433
- 한국IR협의회 기업리서치센터: https://www.kirs.or.kr/research/intro.html
- FinanceDataReader: https://github.com/FinanceData/FinanceDataReader
- pykrx: https://github.com/sharebook-kr/pykrx
- yfinance: https://pypi.org/project/yfinance/
- NAVER Search API: https://developers.naver.com/products/service-api/search/search.md
- BIG KINDS: https://www.kinds.or.kr/
- TradingView Lightweight Charts: https://www.tradingview.com/lightweight-charts/
- Apache ECharts: https://echarts.apache.org/
