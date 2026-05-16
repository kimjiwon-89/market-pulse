# KRX Open API

**인증키**: `CE1A080A2E5A480B8BB511D1386FFD0E33A33D83`
**Base URL**: `https://data-dbg.krx.co.kr/svc/apis`

## 인증 방법

모든 API는 POST 방식, 헤더에 인증키, body에 기준일자를 넣는다.

```
POST https://data-dbg.krx.co.kr/svc/apis/{path}
Headers:
  AUTH_KEY: CE1A080A2E5A480B8BB511D1386FFD0E33A33D83
  Content-Type: application/json
Body:
  {"basDd":"YYYYMMDD"}
Response:
  {"OutBlock_1":[{...}, ...]}
```

> basDd는 영업일 기준. 공휴일/주말 조회 시 빈 배열 반환될 수 있음.

---

## 공통 응답 필드 약어 정리

| 필드명 패턴 | 의미 |
|------------|------|
| `BAS_DD` | 기준일자 |
| `ISU_CD` | 표준코드 (12자리) |
| `ISU_SRT_CD` | 단축코드 (6자리, stock_master.code에 사용) |
| `ISU_NM` / `ISU_ABBRV` | 종목명 / 종목약명 |
| `MKT_NM` / `MKT_TP_NM` | 시장구분 |
| `TDD_CLSPRC` | 당일 종가 |
| `CMPPREVDD_PRC` | 전일 대비 |
| `FLUC_RT` | 등락률 |
| `TDD_OPNPRC` / `HGPRC` / `LWPRC` | 시가 / 고가 / 저가 |
| `ACC_TRDVOL` / `ACC_TRDVAL` | 거래량 / 거래대금 |
| `MKTCAP` | 시가총액 |
| `LIST_SHRS` | 상장주식수 |

---

## API 목록

### 지수 (idx/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| KRX 시리즈 일별시세 | `/idx/krx_dd_trd` | 2010-01-04 | `IDX_CLSS`(계열구분), `IDX_NM`, `CLSPRC_IDX`, `MKTCAP` |
| KOSDAQ 시리즈 일별시세 | `/idx/kosdaq_dd_trd` | 2010-01-04 | 동일 |
| 채권지수 시세 | `/idx/bon_dd_trd` | 2010-01-04 | `BND_IDX_GRP_NM`, `TOT_EARNG_IDX`, `NETPRC_IDX`, `AVG_DURATION`, `BND_IDX_AVG_YD`(YTM) |
| 파생상품지수 시세 | `/idx/drvprod_dd_trd` | 2010-01-04 | `IDX_CLSS`, `IDX_NM`, `CLSPRC_IDX`, `FLUC_RT` |

### 주식 (sto/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| 유가증권 일별매매 | `/sto/stk_bydd_trd` | 2010-01-04 | `ISU_CD`, `ISU_NM`, `MKT_NM`, `SECT_TP_NM`(소속부), `MKTCAP`, `LIST_SHRS` |
| 코스닥 일별매매 | `/sto/ksq_bydd_trd` | 2010-01-04 | 동일 |
| 코넥스 일별매매 | `/sto/knx_bydd_trd` | 2013-07-01 | 동일 |
| 신주인수권증권 일별매매 | `/sto/sw_bydd_trd` | 2010-01-04 | `EXER_PRC`(행사가), `EXST_STRT_DD`~`EXST_END_DD`(존속기간), `TARSTK_ISU_NM`(목적주권) |
| 신주인수권증서 일별매매 | `/sto/sr_bydd_trd` | 2010-02-12 | `ISU_PRC`(신주발행가), `DELIST_DD`(상장폐지일), `TARSTK_ISU_NM` |
| **유가증권 종목기본정보** | `/sto/stk_isu_base_info` | 2010-01-04 | `ISU_SRT_CD`(단축코드), `ISU_ABBRV`, `LIST_DD`(상장일), `SECUGRP_NM`, `KIND_STKCERT_TP_NM`, `PARVAL`(액면가) |
| **코스닥 종목기본정보** | `/sto/ksq_isu_base_info` | 2010-01-04 | 동일 |
| **코넥스 종목기본정보** | `/sto/knx_isu_base_info` | 2013-07-01 | 동일 |

> ★ 종목기본정보 3개 API가 stock_master 전종목 갱신에 사용됨

### ETP (etp/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| ETF 일별매매 | `/etp/etf_bydd_trd` | 2010-01-04 | `NAV`(순자산가치), `INVSTASST_NETASST_TOTAMT`(순자산총액), `LIST_SHRS`(상장좌수), `IDX_IND_NM`(기초지수명), `OBJ_STKPRC_IDX`(기초지수_종가) |
| ETN 일별매매 | `/etp/etn_bydd_trd` | 2014-11-17 | `PER1SECU_INDIC_VAL`(IV), `INDIC_VAL_AMT`(지표가치총액), `IDX_IND_NM` |
| ELW 일별매매 | `/etp/elw_bydd_trd` | 2010-01-04 | `ULY_NM`(기초자산명), `ULY_PRC`(기초자산_종가), `FLUC_RT_ULY` |

### 채권 (bon/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| 국채전문유통시장 | `/bon/kts_bydd_trd` | 2010-01-04 | `BND_EXP_TP_NM`(만기년수), `GOVBND_ISU_TP_NM`(종목구분), `CLSPRC_YD`(종가_수익률), `OPNPRC_YD`, `HGPRC_YD`, `LWPRC_YD` |
| 일반채권시장 | `/bon/bnd_bydd_trd` | 2010-01-04 | `CLSPRC_YD`, `OPNPRC_YD`, `HGPRC_YD`, `LWPRC_YD` |
| 소액채권시장 | `/bon/smb_bydd_trd` | 2010-01-04 | 동일 |

### 파생상품 (drv/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| 선물 (주식선물外) | `/drv/fut_bydd_trd` | 2010-01-04 | `PROD_NM`(상품구분), `MKT_NM`(정규/야간), `SPOT_PRC`(현물가), `SETL_PRC`(정산가), `ACC_OPNINT_QTY`(미결제약정) |
| 주식선물 (유가) | `/drv/eqsfu_stk_bydd_trd` | 2010-01-04 | 동일 |
| 주식선물 (코스닥) | `/drv/eqkfu_ksq_bydd_trd` | 2015-08-03 | 동일 |
| 옵션 (주식옵션外) | `/drv/opt_bydd_trd` | 2010-01-04 | `RGHT_TP_NM`(CALL/PUT), `IMP_VOLT`(내재변동성), `NXTDD_BAS_PRC`(익일정산가), `ACC_OPNINT_QTY` |
| 주식옵션 (유가) | `/drv/eqsop_bydd_trd` | 2010-01-04 | 동일 |
| 주식옵션 (코스닥) | `/drv/eqkop_bydd_trd` | 2017-06-26 | 동일 |

### 일반상품 (gen/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| 석유시장 | `/gen/oil_bydd_trd` | 2012-03-30 | `OIL_NM`(유종), `WT_AVG_PRC`(가중평균_경쟁), `WT_DIS_AVG_PRC`(가중평균_협의) |
| 금시장 | `/gen/gold_bydd_trd` | 2014-03-24 | 기본 OHLCV 구조 |
| 배출권시장 | `/gen/ets_bydd_trd` | 2015-01-12 | 기본 OHLCV 구조 |

### ESG (esg/)

| API명 | 엔드포인트 | 데이터 시작 | 주요 추가 필드 |
|-------|-----------|------------|----------------|
| 사회책임투자채권 | `/esg/sri_bond_info` | 2019-01-01 | `ISUR_NM`(발행기관), `SRI_BND_TP_NM`(채권종류), `ISU_DD`(발행일), `REDMPT_DD`(상환일), `ISU_RT`(표면이자율), `ISU_AMT`(발행금액) |
| ESG 지수 | `/esg/esg_index_info` | 2020-01-02 | `IDX_NM`, `CLSPRC_IDX`, `UPDN_RATE`, `TRD_ISU_CNT`(구성종목수) |
| ESG 증권상품 | `/esg/esg_etp_info` | 2020-01-02 | `ISU_ABBRV`(종목명), `TDD_CLSPRC`, `FLUC_RT`, `LIST_SHRS`(상장좌수) |

---

## stock_master 전종목 갱신 플로우

매일 자정 스케줄러에서 아래 3개 API를 순서대로 호출해 stock_master 테이블을 upsert한다.

```java
// 1. 유가증권 (KOSPI)
POST /sto/stk_isu_base_info  {"basDd":"YYYYMMDD"}
// 2. 코스닥
POST /sto/ksq_isu_base_info  {"basDd":"YYYYMMDD"}
// 3. 코넥스
POST /sto/knx_isu_base_info  {"basDd":"YYYYMMDD"}
```

**필드 매핑**

| KRX 필드 | stock_master 컬럼 | 비고 |
|---------|-----------------|------|
| `ISU_SRT_CD` | `code` | 단축코드 6자리 |
| `ISU_ABBRV` (없으면 `ISU_NM`) | `name` | 종목명 |
| `MKT_TP_NM` | `market` | "유가증권" → KOSPI, "코스닥" → KOSDAQ, "코넥스" → KONEX |
| `SECT_TP_NM` | `sector` | 소속부 (없을 수 있음) |
