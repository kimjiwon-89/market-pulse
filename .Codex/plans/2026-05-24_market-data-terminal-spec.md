# Market Data Terminal Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Market Pulse from basic stock lookup into a Toss-like stock data terminal for chart, orderbook, disclosure, report metadata, and quant-ready intraday inputs without enabling live trading.

**Architecture:** Keep KIS as the primary realtime/trading-style data provider, keep KRX as official EOD/master data, and add OpenDART as the official company filing source. Backend normalizes vendor-specific fields into stable DTOs; frontend renders a tabbed stock terminal under the existing `/stock/:code` route.

**Tech Stack:** Java 17, Spring Boot 3.2, MyBatis, PostgreSQL, Redis, React 19, TypeScript, Vite, Tailwind CSS 4, Recharts initially, `lightweight-charts` only if approved during implementation.

---

date: 2026-05-24  
status: PLANNED_AWAITING_USER_APPROVAL  
source: `.Codex/reports/2026-05-24_market-data-trading-service-research.md`  
html: `.Codex/plans/2026-05-24_market-data-terminal.html`  
target_branch_after_approval: `feature/market-data-terminal`

## 0. Scope Decision

### Build After Approval

| Area | Decision |
|---|---|
| 1-minute chart | Add KIS same-day minute chart API first. Store queried bars later in `stock_minute_bar`. |
| Orderbook | Add read-only KIS orderbook/expected execution API. No order submission. |
| Stock page UI | Expand existing `market-pulse-web/src/pages/StockDetail/index.tsx` into terminal tabs. |
| Disclosures | Add OpenDART-backed design and disabled state. Actual successful data fetch requires an OpenDART API key. |
| Reports | Start with metadata/link model. Do not copy licensed report full text. |
| Quant inputs | Expose normalized DTOs that can later feed MP_CORE factors such as intraday volatility and volume spike. |

### Do Not Build In This Iteration

| Item | Reason |
|---|---|
| Live order execution | Product explicitly does not trade. KIS order APIs remain unused. |
| Full historical 1-minute backfill | KIS same-day minute API does not provide old full history. |
| Broker/analyst report PDF mirroring | Copyright and redistribution rights need contracts. |
| Toss private data parity | Toss may use proprietary licensed data and internal ranking/AI transforms. |
| CFD detailed stock-level dataset | Public source availability is not confirmed. |

## 1. Verified External API Facts

Official KIS samples checked on 2026-05-24:

| Feature | URL | TR ID | Required params | Constraint |
|---|---|---|---|---|
| Same-day minute chart | `/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice` | `FHKST03010200` | `FID_COND_MRKT_DIV_CODE`, `FID_INPUT_ISCD`, `FID_INPUT_HOUR_1`, `FID_PW_DATA_INCU_YN`, `FID_ETC_CLS_CODE` | Same-day minute bars only, max 30 rows per call |
| Orderbook/expected execution | `/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn` | `FHKST01010200` | `FID_COND_MRKT_DIV_CODE`, `FID_INPUT_ISCD` | For realtime refresh, use WebSocket later |
| Member daily trading | `/uapi/domestic-stock/v1/quotations/inquire-member-daily` | `FHPST04540000` | `FID_COND_MRKT_DIV_CODE`, `FID_INPUT_ISCD`, `FID_INPUT_ISCD_2`, `FID_INPUT_DATE_1`, `FID_INPUT_DATE_2`, `FID_SCTN_CLS_CODE` | Needs member code mapping |
| News title | `/uapi/domestic-stock/v1/quotations/news-title` | `FHKST01011800` | `FID_NEWS_OFER_ENTP_CODE`, `FID_COND_MRKT_CLS_CODE`, `FID_INPUT_ISCD`, `FID_TITL_CNTT`, `FID_INPUT_DATE_1`, `FID_INPUT_HOUR_1`, `FID_RANK_SORT_CLS_CODE`, `FID_INPUT_SRNO` | Title/list source, not article body storage |

OpenDART and report sources:

- OpenDART is the official source for company-submitted filings, original XML, XBRL, and corp-code mapping.
- KIRS/FnGuide/WiseReport/broker research should start as metadata, URL, source, publication date, tickers, and internal summary only.
- Licensed report body, consensus, and target-price datasets require a redistribution/license check before storage.

## 2. Backend API Contract

### `GET /api/stock/minute-chart`

Query:

| Param | Required | Example | Rule |
|---|---|---|---|
| `code` | yes | `005930` | Six digit stock code |
| `market` | no | `J` | Default `J`; allow `J`, `NX`, `UN` |
| `time` | no | `153000` | Default current KST time as `HHmmss` |
| `includePast` | no | `true` | Maps to KIS `FID_PW_DATA_INCU_YN=Y`; false maps to `N` |

Response:

```json
{
  "success": true,
  "data": [
    {
      "code": "005930",
      "time": "20260522152900",
      "open": 292500,
      "high": 293000,
      "low": 292000,
      "close": 293000,
      "volume": 35400,
      "tradeAmount": 10372200000,
      "source": "KIS_REST"
    }
  ]
}
```

Normalization rules:

- Sort ascending by `time` before returning to frontend.
- Convert empty numeric strings to `0`.
- If KIS returns no `output2`, return `ApiResponse.success(List.of())`.
- If code format is invalid, return `ApiResponse.failure("종목코드는 6자리 숫자여야 합니다.")`.
- Do not hide the same-day limitation. Swagger summary and frontend empty state must say "KIS 당일 1분봉 기준".

### `GET /api/stock/orderbook`

Query:

| Param | Required | Example | Rule |
|---|---|---|---|
| `code` | yes | `005930` | Six digit stock code |
| `market` | no | `J` | Default `J`; allow `J`, `NX`, `UN` |

Response shape:

```json
{
  "success": true,
  "data": {
    "code": "005930",
    "timestamp": "2026-05-22T15:30:00",
    "asks": [{ "price": 294000, "volume": 1200, "level": 1 }],
    "bids": [{ "price": 293000, "volume": 980, "level": 1 }],
    "expectedPrice": 293000,
    "expectedVolume": 1800
  }
}
```

Rules:

- Return at least the available bid/ask levels from KIS output fields.
- Missing levels are omitted, not filled with fake zeros.
- This API is read-only. Do not add order placement, amend, or cancel endpoints.

### `GET /api/stock/disclosures`

Query:

| Param | Required | Example | Rule |
|---|---|---|---|
| `code` | yes | `005930` | Maps to OpenDART corp code through corp-code mapping |
| `from` | no | `20260101` | Default 90 days ago |
| `to` | no | `20260524` | Default today |

Implementation rule:

- If OpenDART API key is missing, return `ApiResponse.failure("OpenDART API 키가 설정되지 않았습니다.")`.
- Do not scrape KIND or DART pages for body text in this iteration.
- Add source URL fields so the frontend can open official filings.

### `GET /api/stock/reports`

This iteration returns metadata only when data exists:

```json
{
  "source": "KIRS",
  "title": "삼성전자 기업분석",
  "publishedAt": "2026-05-22",
  "url": "https://...",
  "summary": "내부 요약 또는 공개 초록",
  "licenseStatus": "PUBLIC_LINK_ONLY"
}
```

Allowed `licenseStatus` values:

- `PUBLIC_LINK_ONLY`: store metadata, URL, short internal summary only.
- `LICENSED`: source contract permits storing richer fields.
- `UNKNOWN`: show link only, no summary/body.

## 3. File Map

### Backend

| Path | Action | Responsibility |
|---|---|---|
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/controller/StockController.java` | Modify | Add minute chart, orderbook, disclosure/report endpoints. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/service/StockDetailService.java` | Modify | Add KIS minute/orderbook calls and common validation helpers. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockMinuteCandleDto.java` | Create | Stable frontend DTO for 1-minute OHLCV. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockOrderbookDto.java` | Create | Stable frontend DTO for asks, bids, expected execution. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockDisclosureDto.java` | Create | Normalized OpenDART filing metadata. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockReportDto.java` | Create | Public/linked research-report metadata. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisMinutePriceResponse.java` | Create | KIS `output1`/`output2` wrapper for minute chart. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisMinutePriceVo.java` | Create | KIS minute bar raw fields with `@JsonProperty`. |
| `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisOrderbookVo.java` | Create | KIS orderbook raw fields with `@JsonProperty`. |
| `market-pulse-api/src/main/java/com/marketpulse/external/client/OpenDartApiClient.java` | Create after key decision | OpenDART REST caller with explicit key-missing behavior. |
| `market-pulse-api/src/main/resources/application.yml` | Modify | Add `opendart.api.base-url` and empty/key-env placeholder. |
| `market-pulse-api/src/test/java/com/marketpulse/domain/stock/service/StockDetailServiceTest.java` | Create | Unit tests for validation, sorting, parsing, and empty KIS responses. |

### Frontend

| Path | Action | Responsibility |
|---|---|---|
| `market-pulse-web/src/pages/StockDetail/index.tsx` | Modify | Keep route, split body into terminal tabs/components. |
| `market-pulse-web/src/pages/StockDetail/components/StockTerminalTabs.tsx` | Create | Tab state for chart/orderbook, info, news/disclosure, trading status. |
| `market-pulse-web/src/pages/StockDetail/components/StockCandleChart.tsx` | Create | Render daily and minute chart data. |
| `market-pulse-web/src/pages/StockDetail/components/OrderbookPanel.tsx` | Create | Read-only bid/ask and expected execution panel. |
| `market-pulse-web/src/pages/StockDetail/components/DisclosurePanel.tsx` | Create | OpenDART enabled/disabled UI and filing list. |
| `market-pulse-web/src/pages/StockDetail/components/ReportPanel.tsx` | Create | Research report metadata and license-safe links. |
| `market-pulse-web/src/types/index.ts` | Modify | Add `StockMinuteCandle`, `StockOrderbook`, `StockDisclosure`, `StockReport`. |
| `market-pulse-web/package.json` | Modify only if approved | Add `lightweight-charts`; otherwise keep Recharts for the first pass. |

### Docs and Status

| Path | Action |
|---|---|
| `.Codex/status/active-plan.md` | Update to this plan. |
| `.Codex/status/next-tasks.md` | Update approval and blocker handoff. |
| `.claude/.back/back.md` | Update if backend endpoint conventions change. |
| `.claude/.front/front.md` | Update if StockDetail component structure changes. |
| `.Codex/.logs/2026-05-24-log.md` | Append work log. |

## 4. Acceptance Criteria

| AC | Requirement |
|---|---|
| AC-1 | `GET /api/stock/minute-chart?code=005930` calls KIS `FHKST03010200` and returns normalized ascending OHLCV rows. |
| AC-2 | Minute chart endpoint validates six digit codes and returns `ApiResponse.failure()` for invalid input. |
| AC-3 | Minute chart Swagger/summary or frontend copy states that KIS minute bars are same-day data. |
| AC-4 | `GET /api/stock/orderbook?code=005930` calls KIS `FHKST01010200` and returns bid/ask levels without fake levels. |
| AC-5 | No live order submission, amend, or cancel API is added. |
| AC-6 | Stock page has tabs for `차트·호가`, `종목정보`, `뉴스·공시`, `거래현황`. |
| AC-7 | Stock page still renders existing current price, change rate, volume, market cap, PER/PBR, and investor summary. |
| AC-8 | Chart UI can switch between existing daily periods and the new 1-minute view. |
| AC-9 | OpenDART missing key state is explicit and does not crash backend or frontend. |
| AC-10 | Report UI stores/renders metadata and links only unless `licenseStatus=LICENSED`. |
| AC-11 | Backend verification command passes: `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw test`. |
| AC-12 | Frontend verification command passes: `npm run build`. |
| AC-13 | `.claude/.back/back.md`, `.claude/.front/front.md`, and `.Codex/.logs/2026-05-24-log.md` are updated if code changes occur. |

## 5. Implementation Tasks

### Task 0: Approval and Branch Setup

**Files:**
- Read: `.Codex/plans/2026-05-24_market-data-terminal.html`
- Read: `.Codex/plans/2026-05-24_market-data-terminal-spec.md`

- [ ] **Step 1: Wait for user approval**

Expected approval phrase can be informal, for example "이대로 진행" or "승인".

- [ ] **Step 2: Create implementation branch from develop**

Run:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/market-data-terminal
```

Expected: branch is `feature/market-data-terminal`.

- [ ] **Step 3: Re-read required project guides**

Run:

```bash
sed -n '1,220p' .claude/.back/back.md
sed -n '1,220p' .claude/.front/front.md
sed -n '1,220p' .claude/.front/design-guide.md
```

Expected: backend/frontend conventions are fresh before editing.

### Task 1: Backend Tests for KIS Minute and Orderbook Normalization

**Files:**
- Create: `market-pulse-api/src/test/java/com/marketpulse/domain/stock/service/StockDetailServiceTest.java`
- Modify later: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/service/StockDetailService.java`

- [ ] **Step 1: Create failing tests**

Test cases:

- `getMinuteChart_rejectsInvalidCode`: input `5930` returns a failure path or throws a validation exception that controller maps to `ApiResponse.failure()`.
- `getMinuteChart_sortsAscendingAndParsesNumbers`: raw KIS rows in reverse order become ascending DTO rows with numeric values parsed.
- `getMinuteChart_returnsEmptyListWhenOutput2Missing`: null `output2` becomes `List.of()`.
- `getOrderbook_omitsMissingLevels`: blank bid/ask fields are not converted into fake level rows.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw -Dtest=StockDetailServiceTest test
```

Expected: tests fail because DTOs/service methods do not exist yet.

### Task 2: Backend Minute Chart Endpoint

**Files:**
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockMinuteCandleDto.java`
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisMinutePriceResponse.java`
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisMinutePriceVo.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/service/StockDetailService.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/controller/StockController.java`

- [ ] **Step 1: Add DTO**

Fields:

```java
private String code;
private String time;
private long open;
private long high;
private long low;
private long close;
private long volume;
private long tradeAmount;
private String source;
```

- [ ] **Step 2: Add KIS VO wrapper**

Use current project style from `KisDailyPriceResponse` and `StockDailyPriceVo`. Map KIS raw fields with `@JsonProperty`; if exact minute output field names differ in live response, capture the response body log from `ExternalApiClient` and adjust the VO before marking AC-1 PASS.

- [ ] **Step 3: Add service method**

Method signature:

```java
public List<StockMinuteCandleDto> getMinuteChart(String code, String market, String time, boolean includePast)
```

KIS request:

```java
PATH_MINUTE = "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice";
TR_ID = "FHKST03010200";
params.put("FID_COND_MRKT_DIV_CODE", marketOrDefault);
params.put("FID_INPUT_ISCD", code);
params.put("FID_INPUT_HOUR_1", timeOrCurrentKst);
params.put("FID_PW_DATA_INCU_YN", includePast ? "Y" : "N");
params.put("FID_ETC_CLS_CODE", "");
```

- [ ] **Step 4: Add controller endpoint**

Endpoint:

```java
@GetMapping("/minute-chart")
public ApiResponse<List<StockMinuteCandleDto>> minuteChart(
    @RequestParam String code,
    @RequestParam(defaultValue = "J") String market,
    @RequestParam(required = false) String time,
    @RequestParam(defaultValue = "true") boolean includePast
)
```

- [ ] **Step 5: Run backend test**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw -Dtest=StockDetailServiceTest test
```

Expected: minute chart tests pass.

### Task 3: Backend Orderbook Endpoint

**Files:**
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockOrderbookDto.java`
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/vo/KisOrderbookVo.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/service/StockDetailService.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/controller/StockController.java`
- Test: `market-pulse-api/src/test/java/com/marketpulse/domain/stock/service/StockDetailServiceTest.java`

- [ ] **Step 1: Add DTO**

DTO structure:

```java
public class StockOrderbookDto {
    private String code;
    private String timestamp;
    private List<OrderbookLevelDto> asks;
    private List<OrderbookLevelDto> bids;
    private long expectedPrice;
    private long expectedVolume;
}
```

Level structure:

```java
public class OrderbookLevelDto {
    private int level;
    private long price;
    private long volume;
}
```

- [ ] **Step 2: Add service call**

KIS request:

```java
PATH_ORDERBOOK = "/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn";
TR_ID = "FHKST01010200";
params.put("FID_COND_MRKT_DIV_CODE", marketOrDefault);
params.put("FID_INPUT_ISCD", code);
```

- [ ] **Step 3: Add controller endpoint**

Endpoint:

```java
@GetMapping("/orderbook")
public ApiResponse<StockOrderbookDto> orderbook(
    @RequestParam String code,
    @RequestParam(defaultValue = "J") String market
)
```

- [ ] **Step 4: Verify**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw test
```

Expected: all backend tests pass.

### Task 4: OpenDART Disabled State and Contract

**Files:**
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/dto/StockDisclosureDto.java`
- Create after key decision: `market-pulse-api/src/main/java/com/marketpulse/external/client/OpenDartApiClient.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/stock/controller/StockController.java`
- Modify: `market-pulse-api/src/main/resources/application.yml`

- [ ] **Step 1: Add config placeholders**

Add:

```yaml
opendart:
  api:
    base-url: https://opendart.fss.or.kr/api
    key: ${OPENDART_API_KEY:}
```

- [ ] **Step 2: Add key-missing behavior**

When `OPENDART_API_KEY` is blank, disclosure endpoint returns:

```java
ApiResponse.failure("OpenDART API 키가 설정되지 않았습니다.")
```

- [ ] **Step 3: Stop here if key is unavailable**

Without an API key, do not fake disclosure rows. Frontend should render disabled state.

### Task 5: Frontend Types and API Wiring

**Files:**
- Modify: `market-pulse-web/src/types/index.ts`
- Modify: `market-pulse-web/src/pages/StockDetail/index.tsx`

- [ ] **Step 1: Add types**

Add:

```ts
export interface StockMinuteCandle {
  code: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeAmount: number;
  source: "KIS_REST" | "KIS_WS" | "VENDOR";
}

export interface StockOrderbookLevel {
  level: number;
  price: number;
  volume: number;
}

export interface StockOrderbook {
  code: string;
  timestamp: string;
  asks: StockOrderbookLevel[];
  bids: StockOrderbookLevel[];
  expectedPrice: number;
  expectedVolume: number;
}

export interface StockDisclosure {
  receiptNo: string;
  title: string;
  reportName: string;
  submittedAt: string;
  submitter: string;
  sourceUrl: string;
}

export interface StockReport {
  source: string;
  title: string;
  publishedAt: string;
  url: string;
  summary: string | null;
  licenseStatus: "PUBLIC_LINK_ONLY" | "LICENSED" | "UNKNOWN";
}
```

- [ ] **Step 2: Add fetch functions inside StockDetail or local helpers**

Endpoints:

```ts
apiClient.get("/stock/minute-chart", { params: { code, market: "J", includePast: true } })
apiClient.get("/stock/orderbook", { params: { code, market: "J" } })
apiClient.get("/stock/disclosures", { params: { code } })
apiClient.get("/stock/reports", { params: { code } })
```

### Task 6: Frontend Terminal Tabs

**Files:**
- Create: `market-pulse-web/src/pages/StockDetail/components/StockTerminalTabs.tsx`
- Create: `market-pulse-web/src/pages/StockDetail/components/StockCandleChart.tsx`
- Create: `market-pulse-web/src/pages/StockDetail/components/OrderbookPanel.tsx`
- Create: `market-pulse-web/src/pages/StockDetail/components/DisclosurePanel.tsx`
- Create: `market-pulse-web/src/pages/StockDetail/components/ReportPanel.tsx`
- Modify: `market-pulse-web/src/pages/StockDetail/index.tsx`

- [ ] **Step 1: Split current page without changing behavior**

Move existing chart and info sections into components while preserving:

- Current price
- Change amount/rate
- Volume/trading value
- Market cap
- PER/PBR
- Daily chart period chips
- Investor summary table

- [ ] **Step 2: Add tabs**

Tabs:

- `차트·호가`
- `종목정보`
- `뉴스·공시`
- `거래현황`

Rules:

- Use existing `.card`, `.chip`, `.t`, `.num`, `.up`, `.down` styles.
- Do not add marketing copy.
- Keep Korean finance color convention: red up, blue down.
- Mobile: tabs wrap or horizontally scroll without text overlap.

- [ ] **Step 3: Add minute toggle**

Chart ranges:

- `1분`
- `1M`
- `3M`
- `1Y`

Rules:

- `1분` uses `StockMinuteCandle[]`.
- Existing periods use `StockChartItem[]`.
- Empty state text: `당일 1분봉 데이터가 없습니다. KIS 당일분봉 기준입니다.`

### Task 7: Verification and Documentation

**Files:**
- Modify: `.claude/.back/back.md`
- Modify: `.claude/.front/front.md`
- Modify: `.Codex/.logs/2026-05-24-log.md`
- Modify: `.Codex/status/back-report.md`
- Modify: `.Codex/status/front-report.md`
- Modify: `.Codex/status/verify-report.md`

- [ ] **Step 1: Backend verification**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./mvnw test
```

Expected: exit code 0.

- [ ] **Step 2: Frontend verification**

Run:

```bash
cd market-pulse-web
npm run build
```

Expected: exit code 0.

- [ ] **Step 3: AC checklist**

Update `.Codex/status/verify-report.md` with each AC from this spec as `PASS`, `FAIL`, or `BLOCKED`.

## 6. Blocker Direction

| Blocker | Current Status | Direction |
|---|---|---|
| Historical minute bars before collection start | Not available from KIS same-day API | Start saving now, then evaluate KRX/Koscom/vendor backfill. |
| Full report bodies | Copyright/license blocked | Store metadata/link/summary only; negotiate FnGuide/WiseReport/KIRS terms for richer data. |
| OpenDART live data | Needs `OPENDART_API_KEY` | Implement key-missing state first, then enable real calls after key is available. |
| CFD by stock | Public availability unclear | Keep UI absent or disabled until official/vendor source is confirmed. |
| Realtime all-stock polling | REST rate limits | WebSocket for watchlist/top-volume symbols, cache snapshots, avoid whole-market REST polling. |

## 7. Implementation Handoff

This plan is ready for user review. Code implementation must not start until the user approves this plan because the project pipeline requires user approval before `workation-back`/`workation-front` style implementation.
