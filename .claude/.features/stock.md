# 종목 마스터 + 종목 상세 + @mention 태그 기능

**상태**: 종목 상세 페이지 완료 / stock_master DB + @mention 구현 예정

---

## 1. stock_master (DB + 스케줄러)

### 목적
KRX 전종목(코드·이름·시장·업종)을 DB에 저장하고 매일 자정 자동 갱신.  
@mention 자동완성, 종목 검색 API의 데이터 소스.

### DB

```sql
CREATE TABLE stock_master (
    code       VARCHAR(10)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    market     VARCHAR(10)  NOT NULL,   -- 'KOSPI' | 'KOSDAQ'
    sector     VARCHAR(100),
    updated_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_stock_master_name ON stock_master(name);
```

### 갱신 스케줄러

`@Scheduled(cron = "0 0 0 * * *")` — 매일 자정 KRX API 호출 → upsert

| 시장 | KRX 엔드포인트 |
|------|---------------|
| KOSPI | `POST /sto/stk_isu_base_info` |
| KOSDAQ | `POST /sto/ksq_isu_base_info` |
| KONEX | `POST /sto/knx_isu_base_info` |

필드 매핑: `ISU_SRT_CD` → code, `ISU_ABBRV`(없으면 `ISU_NM`) → name, `MKT_TP_NM` → market, `SECT_TP_NM` → sector

### API

```
GET /api/stock/search?q=삼성&limit=10
→ [{ code, name, market, sector }]
```

---

## 2. 종목 상세 페이지 (`/stock/:code`)

**상태**: 완료

### 화면 구성

```
KPI 카드: 현재가 / 등락률 / 거래량 / 시가총액
기간 칩 (1M / 3M / 1Y) + AreaChart
투자자동향 카드 (외국인·기관·개인 순매수대금·매수·매도)
시세 정보 카드 (시가·고가·저가·52주최고/최저)
```

### API

```
GET /api/stock/detail?code=005930     ← KIS FHKST01010100
GET /api/stock/chart?code=005930&period=1M|3M|1Y  ← KIS FHKST01010400
GET /api/stock/investor?code=005930   ← KIS FHKST01010900
```

### 타입 (`src/types/index.ts`)

`StockDetail`, `StockChartItem`, `StockInvestor`, `StockMasterItem`

---

## 3. @mention 태그 (구현 예정)

> stock_master 구현 완료 후 진행

### DB

```sql
CREATE TABLE memo_stock_tag (
    id                  BIGSERIAL PRIMARY KEY,
    memo_id             BIGINT       NOT NULL REFERENCES investor_memo(id) ON DELETE CASCADE,
    stock_code          VARCHAR(10)  NOT NULL,
    stock_name          VARCHAR(100) NOT NULL,
    price_at_tag        BIGINT       NOT NULL,
    change_rate_at_tag  DECIMAL(8,2),
    tagged_at           TIMESTAMP    DEFAULT NOW()
);
```

### UX 흐름

```
textarea에 @ 입력
  → GET /api/stock/search?q=<이후 입력> → 드롭다운
  → 종목 선택 → @종목명(코드) 삽입
  → 메모 저장 시 현재가 스냅샷과 함께 POST /api/investor/memo/{id}/tag
```

### 태그 표시 (메모 카드)

```
[삼성전자 005930]  기준가 82,000원  →  현재 84,500원  +3.05%
```

- 현재가: trade-top 데이터 우선 재사용, 없으면 `/api/stock/detail` 호출
- X 버튼으로 태그 제거 (`DELETE /api/investor/memo/tag/{tagId}`)

### 추가 API

```
POST   /api/investor/memo/{memoId}/tag  { stockCode, stockName, priceAtTag, changeRateAtTag }
DELETE /api/investor/memo/tag/{tagId}
```
