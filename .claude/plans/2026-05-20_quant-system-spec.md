# 퀀트 모델 백테스팅 & 모의투자 시스템

## 범위

- 백엔드: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/` (신규 도메인)
- 프론트엔드: `market-pulse-web/src/pages/QuantBacktest/` (신규 페이지)
- 수정 파일: `SecurityConfig.java`, `router.tsx`, `Nav.tsx`, `src/types/index.ts`

## 확정 결정사항

- 초기 수집 범위: 전체 데이터 수집 (`ALL` = KOSPI/KOSDAQ 지수 + KOSPI/KOSDAQ 주식 + 채권 + 금)
- 벤치마크: KOSPI와 KOSDAQ을 둘 다 제공
- 거래 비용: 수수료 0.015% + 매도세 0.18%
- 데이터 수집 트리거: 매일 16:00 자동 수집 + ADMIN 전용 수동 API 병행

---

## DB 변경

psql에서 직접 실행 필요. 기존 테이블과 충돌 없음.

```sql
-- 1. KRX 일별 OHLCV 히스토리 (지수·주식·채권·금 통합)
CREATE TABLE market_daily_price (
    id           BIGSERIAL    PRIMARY KEY,
    trade_date   DATE         NOT NULL,
    asset_code   VARCHAR(20)  NOT NULL,
    asset_type   VARCHAR(10)  NOT NULL,   -- STOCK | INDEX | BOND | GOLD | ETF
    asset_name   VARCHAR(100),
    open_price   NUMERIC(18,4),
    high_price   NUMERIC(18,4),
    low_price    NUMERIC(18,4),
    close_price  NUMERIC(18,4) NOT NULL,
    volume       BIGINT,
    market_cap   BIGINT,
    sector       VARCHAR(100),
    ytm          NUMERIC(8,4),
    created_at   TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT uq_market_daily_price UNIQUE (trade_date, asset_code, asset_type)
);
CREATE INDEX idx_mdp_date_type ON market_daily_price(trade_date, asset_type);
CREATE INDEX idx_mdp_code_date ON market_daily_price(asset_code, trade_date);

-- 2. 전략 메타
CREATE TABLE quant_strategy (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(50)  NOT NULL UNIQUE,
    description     TEXT,
    asset_type      VARCHAR(10)  NOT NULL,
    rebalance_cycle VARCHAR(20)  NOT NULL,
    params          JSONB,
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- 3. 백테스팅 날짜별 포트폴리오 가치
CREATE TABLE quant_backtest_result (
    id              BIGSERIAL    PRIMARY KEY,
    strategy_id     BIGINT       NOT NULL REFERENCES quant_strategy(id),
    from_date       DATE         NOT NULL,
    to_date         DATE         NOT NULL,
    trade_date      DATE         NOT NULL,
    portfolio_value BIGINT       NOT NULL,
    return_pct      NUMERIC(10,6) NOT NULL,
    cash            BIGINT       NOT NULL DEFAULT 0,
    equity          BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT uq_qbr UNIQUE (strategy_id, from_date, to_date, trade_date)
);
CREATE INDEX idx_qbr_strategy_date ON quant_backtest_result(strategy_id, from_date, to_date, trade_date);

-- 4. 매매 이력
CREATE TABLE quant_trade_log (
    id             BIGSERIAL    PRIMARY KEY,
    strategy_id    BIGINT       NOT NULL REFERENCES quant_strategy(id),
    from_date      DATE         NOT NULL,
    to_date        DATE         NOT NULL,
    trade_date     DATE         NOT NULL,
    asset_code     VARCHAR(20)  NOT NULL,
    asset_name     VARCHAR(100),
    asset_type     VARCHAR(10)  NOT NULL,
    trade_type     VARCHAR(10)  NOT NULL,   -- BUY | SELL
    price          NUMERIC(18,4) NOT NULL,
    quantity       BIGINT       NOT NULL,
    amount         BIGINT       NOT NULL,
    weight         NUMERIC(8,6),
    reason         VARCHAR(200),
    commission     BIGINT       DEFAULT 0,
    tax            BIGINT       DEFAULT 0,
    created_at     TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_qtl_strategy ON quant_trade_log(strategy_id, from_date, to_date, trade_date);
```

---

## 백엔드 구현

### 패키지 위치
`com.marketpulse.domain.quant`

---

### VO 클래스

**MarketDailyPriceVo.java** — `domain/quant/vo/`
```java
// 필드: id(Long), tradeDate(LocalDate), assetCode(String), assetType(String),
//       assetName(String), openPrice(BigDecimal), highPrice(BigDecimal),
//       lowPrice(BigDecimal), closePrice(BigDecimal), volume(Long),
//       marketCap(Long), sector(String), ytm(BigDecimal), createdAt(LocalDateTime)
```

**QuantStrategyVo.java** — `domain/quant/vo/`
```java
// 필드: id(Long), name(String), nameEn(String), description(String),
//       assetType(String), rebalanceCycle(String), params(String/JSONB), isActive(Boolean)
```

**QuantBacktestResultVo.java** — `domain/quant/vo/`
```java
// 필드: id(Long), strategyId(Long), fromDate(LocalDate), toDate(LocalDate),
//       tradeDate(LocalDate), portfolioValue(Long), returnPct(BigDecimal),
//       cash(Long), equity(Long)
```

**QuantTradeLogVo.java** — `domain/quant/vo/`
```java
// 필드: id(Long), strategyId(Long), fromDate(LocalDate), toDate(LocalDate),
//       tradeDate(LocalDate), assetCode(String), assetName(String),
//       assetType(String), tradeType(String), price(BigDecimal), quantity(Long),
//       amount(Long), weight(BigDecimal), reason(String), commission(Long), tax(Long)
```

---

### DTO 클래스

**StrategyDto.java** — `domain/quant/dto/`
```java
// 응답용 — id, name, nameEn, description, assetType, rebalanceCycle, params(Map<String,Object>)
```

**BacktestRequestDto.java** — `domain/quant/dto/`
```java
// 요청 파라미터 — strategyId(Long), from(String), to(String), initialCash(Long, 기본 100_000_000L)
```

**BacktestResponseDto.java** — `domain/quant/dto/`
```java
// 응답 — strategyId, strategyName, from, to, initialCash
//         performance: PerformanceSummaryDto { totalReturn, annualizedReturn, mdd, sharpeRatio, totalTrades, winRate }
//         equityCurve: List<EquityPointDto> { date(String), value(Long), returnPct(double) }
//         currentAllocation: List<AllocationDto> { assetName, weight(double) }
```

**PerformanceResponseDto.java** — `domain/quant/dto/`
```java
// 전략 비교용 — from, to
//   benchmark: List<EquityPointDto>
//   strategies: List<StrategyPerformanceDto> {
//     strategyId, strategyName, totalReturn, mdd, sharpeRatio, equityCurve: List<EquityPointDto>
//   }
```

**TradeLogDto.java** — `domain/quant/dto/`
```java
// 응답 — id, tradeDate(String), assetCode, assetName, assetType, tradeType,
//         price(long), quantity(long), amount(long), weight(double), reason, commission(long), tax(long)
```

**TradeLogPageDto.java** — `domain/quant/dto/`
```java
// 페이지 응답 래퍼 — total(int), page(int), size(int), items(List<TradeLogDto>)
```

**CollectStatusDto.java** — `domain/quant/dto/`
```java
// status(String: IDLE|RUNNING|DONE|ERROR), progress(double 0~1),
// processedDates(int), totalDates(int), latestDate(String)
```

---

### Mapper 인터페이스 + XML

**MarketDailyPriceMapper.java** — `domain/quant/mapper/`
```java
void upsertBatch(List<MarketDailyPriceVo> list);
List<MarketDailyPriceVo> findByCodeAndDateRange(
    @Param("assetCode") String assetCode,
    @Param("assetType") String assetType,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate
);
List<MarketDailyPriceVo> findByTypeAndDate(
    @Param("assetType") String assetType,
    @Param("tradeDate") LocalDate tradeDate
);
// 섹터별 수익률 계산용
List<MarketDailyPriceVo> findTopBySectorReturn(
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate,
    @Param("topN") int topN
);
```

`resources/mapper/quant/MarketDailyPriceMapper.xml`
- INSERT ON CONFLICT DO UPDATE (upsert)
- `close_price`, `open_price`, `high_price`, `low_price`, `ytm` → `::numeric` 캐스트 필수

**QuantStrategyMapper.java** — `domain/quant/mapper/`
```java
List<QuantStrategyVo> findAllActive();
QuantStrategyVo findById(Long id);
void insertIfNotExists(QuantStrategyVo vo);  // nameEn 중복 시 무시
```

**QuantBacktestResultMapper.java** — `domain/quant/mapper/`
```java
List<QuantBacktestResultVo> findByStrategyAndPeriod(
    @Param("strategyId") Long strategyId,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate
);
void insertBatch(List<QuantBacktestResultVo> list);
void deleteByStrategyAndPeriod(
    @Param("strategyId") Long strategyId,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate
);
```

**QuantTradeLogMapper.java** — `domain/quant/mapper/`
```java
int countByStrategyAndPeriod(
    @Param("strategyId") Long strategyId,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate,
    @Param("tradeType") String tradeType  // nullable
);
List<QuantTradeLogVo> findPageByStrategyAndPeriod(
    @Param("strategyId") Long strategyId,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate,
    @Param("tradeType") String tradeType,
    @Param("offset") int offset,
    @Param("limit") int limit
);
void insertBatch(List<QuantTradeLogVo> list);
void deleteByStrategyAndPeriod(
    @Param("strategyId") Long strategyId,
    @Param("fromDate") LocalDate fromDate,
    @Param("toDate") LocalDate toDate
);
```

---

### 전략 인터페이스

**QuantStrategyInterface.java** — `domain/quant/service/strategy/`
```java
public interface QuantStrategyInterface {
    String getNameEn();  // MA_CROSSOVER 등
    BacktestResponseDto run(
        QuantStrategyVo strategy,
        LocalDate fromDate,
        LocalDate toDate,
        long initialCash
    );
}
```

---

### 전략 구현 클래스 (5개)

모두 `domain/quant/service/strategy/` 하위에 위치.

**MaCrossoverStrategy.java** — `@Component`
- 데이터: `market_daily_price WHERE asset_code='KOSPI' AND asset_type='INDEX'`
- 로직: 20일 단순이동평균(SMA) > 60일 SMA → BUY, < → SELL
- 신호 발생일 다음 영업일 종가로 매매 (look-ahead bias 방지)
- 보유 비중: 시장 100% 또는 현금 100%

**MomentumStrategy.java** — `@Component`
- 데이터: `market_daily_price WHERE asset_type='STOCK'`
- 매월 첫 영업일: 직전 21 영업일 종가 수익률 상위 20개 종목 선정
- 동일가중(1/20) 매수, 당월 마지막 영업일 매도
- 수수료 0.015% + 매도세 0.18%

**SectorRotationStrategy.java** — `@Component`
- 데이터: `market_daily_price WHERE asset_type='STOCK'` (sector 컬럼 활용)
- 매월 첫 영업일: 섹터별 직전 21 영업일 평균 수익률 → 상위 3섹터
- 각 섹터 내 market_cap 상위 5종목 편입 (동일가중)

**AssetAllocationStrategy.java** — `@Component`
- 데이터: KOSPI INDEX + BOND(3년) + GOLD
- 목표 비중: 60/30/10
- 분기 마지막 영업일(3·6·9·12월) 리밸런싱
- 벤치마크 대비 초과수익 계산 포함

**VolatilityAdjustStrategy.java** — `@Component`
- 데이터: KOSPI INDEX + BOND(3년)
- 매일: KOSPI 20일 연환산 변동성(표준편차 × √252) 계산
- 변동성 > 15%: 채권 80% + 주식 20%
- 변동성 ≤ 15%: 주식 70% + 채권 30%

---

### Service 클래스

**QuantStrategyService.java** — `domain/quant/service/`
```java
@Service
public class QuantStrategyService {
    // 전략 목록 조회
    public List<StrategyDto> getAllStrategies();
    // nameEn → 구현체 매핑
    public QuantStrategyInterface getStrategyImpl(String nameEn);
}
```

**QuantBacktestService.java** — `domain/quant/service/`
```java
@Service
public class QuantBacktestService {
    // DB 캐시 조회 → 없으면 전략 실행 → 저장 후 반환
    public BacktestResponseDto backtest(BacktestRequestDto req);

    // 복수 전략 비교 + KOSPI 벤치마크
    public PerformanceResponseDto compareAll(String from, String to, List<Long> strategyIds);

    // 매매 이력 페이지 조회
    public TradeLogPageDto getTradeLogs(
        Long strategyId, String from, String to, String tradeType, int page, int size
    );

    // 성과 지표 계산 — totalReturn, annualizedReturn, MDD, sharpeRatio
    private PerformanceSummaryDto calcPerformance(List<QuantBacktestResultVo> curve);
}
```

**QuantCollectService.java** — `domain/quant/service/`
```java
@Service
public class QuantCollectService {
    // 비동기 수집 (CompletableFuture + AtomicReference로 상태 관리)
    @Async
    public void collectAsync(String from, String to, String dataType);

    // 현재 수집 상태 반환
    public CollectStatusDto getStatus();

    // KRX API 호출 — 날짜 1개 × 데이터타입별 엔드포인트
    // 500ms 스로틀 (Thread.sleep(500))
    private List<MarketDailyPriceVo> fetchFromKrx(LocalDate date, String dataType);
}
```

KRX 엔드포인트 매핑:
- INDEX → `POST /idx/kospi_dd_trd` + `POST /idx/kosdaq_dd_trd`
- STOCK → `POST /sto/stk_bydd_trd`
- BOND → `POST /bon/kts_bydd_trd`
- GOLD → `POST /gen/gold_bydd_trd`
- ALL → 위 전부

KRX 인증: 기존 `application.yml`의 `krx.api.auth-key` / `krx.api.base-url` 사용.

---

### Runner & Scheduler

**QuantStrategyInitRunner.java** — `domain/quant/runner/`
```java
@Component
@Order(2)  // InitialDataRunner 이후 실행
public class QuantStrategyInitRunner implements CommandLineRunner {
    // quant_strategy에 5개 전략이 없으면 INSERT
    // nameEn 기준으로 중복 체크 (insertIfNotExists)
}
```

5개 전략 초기 데이터:
| nameEn | name | assetType | rebalanceCycle | params |
|--------|------|-----------|---------------|--------|
| MA_CROSSOVER | 이동평균 돌파 | INDEX | SIGNAL | `{"shortMa":20,"longMa":60}` |
| MOMENTUM | 모멘텀 | STOCK | MONTHLY | `{"topN":20,"lookbackDays":21}` |
| SECTOR_ROTATION | 섹터 로테이션 | STOCK | MONTHLY | `{"topSectors":3,"topStocksPerSector":5}` |
| ASSET_ALLOCATION | 자산배분 | MULTI | QUARTERLY | `{"stockWeight":0.6,"bondWeight":0.3,"goldWeight":0.1}` |
| VOLATILITY_ADJUST | 변동성 조절 | MULTI | DAILY | `{"volThreshold":0.15,"highVolStockWeight":0.2,"lowVolStockWeight":0.7,"volLookbackDays":20}` |

**QuantDailyCollectScheduler.java** — `domain/quant/scheduler/`
```java
@Component
public class QuantDailyCollectScheduler {
    @Scheduled(cron = "0 0 16 * * MON-FRI")
    public void dailyCollect();
    // 어제 날짜로 dataType=ALL 수집
    // 이미 수집된 날짜는 upsert로 덮어쓰기 (중복 무방)
}
```

---

### Controller

**QuantController.java** — `domain/quant/controller/`
```java
@RestController
@RequestMapping("/api/quant")
@Tag(name = "Quant", description = "퀀트 백테스팅 & 모의투자")
public class QuantController {

    @GetMapping("/strategies")
    @Operation(summary = "전략 목록 조회")
    public ResponseEntity<ApiResponse<List<StrategyDto>>> getStrategies();

    @GetMapping("/backtest")
    @Operation(summary = "백테스팅 실행/결과 조회")
    public ResponseEntity<ApiResponse<BacktestResponseDto>> backtest(
        @RequestParam Long strategyId,
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam(defaultValue = "100000000") Long initialCash
    );

    @GetMapping("/performance")
    @Operation(summary = "전략 비교")
    public ResponseEntity<ApiResponse<PerformanceResponseDto>> performance(
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam(required = false) String strategyIds  // 콤마 구분, null이면 전체
    );

    @GetMapping("/trades")
    @Operation(summary = "매매 이력 조회")
    public ResponseEntity<ApiResponse<TradeLogPageDto>> trades(
        @RequestParam Long strategyId,
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam(required = false) String tradeType,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    );

    @PostMapping("/collect")
    @Operation(summary = "히스토리 데이터 수집 (ADMIN 전용)")
    public ResponseEntity<ApiResponse<CollectStatusDto>> collect(
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam(defaultValue = "ALL") String dataType
    );

    @GetMapping("/collect/status")
    @Operation(summary = "수집 상태 확인 (ADMIN 전용)")
    public ResponseEntity<ApiResponse<CollectStatusDto>> collectStatus();
}
```

---

### SecurityConfig.java 수정 사항

기존 `global/config/SecurityConfig.java`에 아래 경로 추가:
```java
.requestMatchers("/api/quant/collect/**").hasRole("ADMIN")
// 나머지 /api/quant/** 는 공개
.requestMatchers("/api/quant/**").permitAll()
```
위 2줄을 기존 `/api/admin/**` ADMIN 규칙 이후, `/api/**` permitAll 이전에 삽입.

---

## 프론트엔드 구현

### 타입 추가 (`src/types/index.ts`)

```typescript
export interface QuantStrategy {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  assetType: 'INDEX' | 'STOCK' | 'MULTI';
  rebalanceCycle: 'SIGNAL' | 'MONTHLY' | 'QUARTERLY' | 'DAILY';
  params: Record<string, unknown>;
}

export interface EquityPoint {
  date: string;       // YYYYMMDD
  value: number;
  returnPct: number;  // 0.0834 = 8.34%
}

export interface PerformanceSummary {
  totalReturn: number;
  annualizedReturn: number;
  mdd: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
}

export interface AllocationItem {
  assetName: string;
  weight: number;
}

export interface BacktestResult {
  strategyId: number;
  strategyName: string;
  from: string;
  to: string;
  initialCash: number;
  performance: PerformanceSummary;
  equityCurve: EquityPoint[];
  currentAllocation: AllocationItem[];
}

export interface StrategyComparison {
  strategyId: number;
  strategyName: string;
  totalReturn: number;
  mdd: number;
  sharpeRatio: number;
  equityCurve: EquityPoint[];
}

export interface PerformanceResponse {
  from: string;
  to: string;
  benchmark: EquityPoint[];
  strategies: StrategyComparison[];
}

export interface TradeLog {
  id: number;
  tradeDate: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  tradeType: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  amount: number;
  weight: number;
  reason: string;
  commission: number;
  tax: number;
}

export interface TradeLogPage {
  total: number;
  page: number;
  size: number;
  items: TradeLog[];
}
```

---

### 페이지 컴포넌트

**`src/pages/QuantBacktest/index.tsx`** — 메인 컨테이너
- named export: `export function QuantBacktest()`
- 상태: `activeStrategyId` (null = 전략비교), `from`, `to`, `backtestResult`, `performanceResult`, `tradeLogs`, `loading`
- 초기 기간: 오늘 기준 5년 전 ~ 오늘 (`new Date().getFullYear() - 5`)
- activeStrategyId가 null이면 GET /api/quant/performance, 특정 전략이면 GET /api/quant/backtest
- 레이아웃: `DateRangePicker` → `StrategyTabs` → `EquityChart` → `PerformanceCards` → `div.grid grid-cols-1 lg:grid-cols-[1fr_auto]` (TradeTimeline | AllocationChart)

**`src/pages/QuantBacktest/DateRangePicker.tsx`**
- props: `from: string`, `to: string`, `onChange: (from: string, to: string) => void`
- 날짜 형식: YYYYMMDD (input[type=date]의 value는 YYYY-MM-DD, 내부 변환)
- 프리셋 칩: "최근 1년", "최근 3년", "최근 5년", "전체(2010~)"
- 전체 클릭 시 from="20100104" (2010년 첫 영업일 근사값)

**`src/pages/QuantBacktest/StrategyTabs.tsx`**
- props: `strategies: QuantStrategy[]`, `activeId: number | null`, `onSelect: (id: number | null) => void`
- 탭 목록: "전략 비교"(null) + strategies 순서대로
- `.seg-tabs` 또는 `.tabs` 패턴 적용

**`src/pages/QuantBacktest/EquityChart.tsx`**
- props:
  - 전략비교 탭: `data: PerformanceResponse`
  - 단일 전략 탭: `equityCurve: EquityPoint[]`, `strategyName: string`
- Recharts `LineChart` 사용
- 전략비교 시 전략별 색상 고정:
  - MA_CROSSOVER: `#1e5edb`, MOMENTUM: `#d62828`, SECTOR_ROTATION: `#0f766e`,
  - ASSET_ALLOCATION: `#a16207`, VOLATILITY_ADJUST: `#7c3aed`
  - KOSPI 벤치마크: `#a8a29e` (점선)
- Y축: 100 기준 인덱스 (초기값 100으로 정규화)
- `ResponsiveContainer width="100%" height={isMobile ? 200 : 300}`
- X축 tickFormatter: YYYYMMDD → "YY.MM" 표시

**`src/pages/QuantBacktest/PerformanceCards.tsx`**
- props: `performance: PerformanceSummary | null`, `loading: boolean`
- 4개 `.stat-cell`: 총수익률(%), 최대낙폭(%), 샤프비율, 총거래횟수
- 총수익률·MDD: `fmtPct()` + `dirCls()` 색상
- 로딩 중: `<div className="sk" />`

**`src/pages/QuantBacktest/AllocationChart.tsx`**
- props: `allocation: AllocationItem[]`
- Recharts `PieChart` + `Pie` + `Cell`
- 색상 팔레트: `['#1e5edb','#0f766e','#a16207','#d62828','#7c3aed']`
- `innerRadius={50} outerRadius={80}` (도넛 형태)
- 범례: 자산명 + 비율(%)

**`src/pages/QuantBacktest/TradeTimeline.tsx`**
- props: `strategyId: number | null`, `from: string`, `to: string`
- GET /api/quant/trades 호출 (strategyId가 null이면 렌더링 없음)
- 필터 칩: "전체", "BUY", "SELL"
- 테이블 컬럼: 날짜 | 종목명 | 신호 | 가격 | 비중 | 이유
- BUY 뱃지: `badge badge-blue`, SELL 뱃지: `badge badge-red` 스타일
- 종목명 클릭 시 assetType==='STOCK'이면 `navigate('/stock/' + item.assetCode)`
- 페이지네이션 (size=50 기본)

---

### 라우터·네비게이션 수정

**`src/app/router.tsx`**
- 기존 lotto 라우트 다음에 추가:
  ```typescript
  { path: '/quant', element: <QuantBacktest /> }
  ```

**`src/components/common/Nav.tsx`**
- 기존 lotto 메뉴 아래 퀀트 추가
- 레이블: "퀀트 백테스팅"
- 아이콘 path: `M3 3v18h18M7 16l4-8 4 4 4-6` (라인 차트 유사 아이콘)
- 경로: `/quant`

---

### API 호출 패턴

```typescript
// 전략 목록
const res = await apiClient.get('/quant/strategies');

// 전략 비교
const res = await apiClient.get('/quant/performance', { params: { from, to } });

// 단일 전략 백테스팅
const res = await apiClient.get('/quant/backtest', { params: { strategyId, from, to } });

// 매매 이력
const res = await apiClient.get('/quant/trades', {
  params: { strategyId, from, to, tradeType, page, size }
});
```

---

## Acceptance Criteria

### 백엔드

- [ ] AC-BE-1: GET /api/quant/strategies 호출 시 5개 전략 목록(id, name, nameEn, assetType, rebalanceCycle, params)을 포함한 ApiResponse.success 반환.
- [ ] AC-BE-2: POST /api/quant/collect?from=20200101&to=20200110&dataType=INDEX 호출 시 KRX kospi_dd_trd + kosdaq_dd_trd 데이터를 market_daily_price에 upsert하고, 응답에 collectedDates=10이 포함됨.
- [ ] AC-BE-3: GET /api/quant/collect/status 호출 시 status 필드가 IDLE | RUNNING | DONE | ERROR 중 하나를 반환함.
- [ ] AC-BE-4: market_daily_price에 데이터가 존재하는 기간으로 GET /api/quant/backtest?strategyId=1&from=20220101&to=20221231 호출 시 equityCurve 배열이 1개 이상이고, performance.totalReturn이 실수로 반환됨.
- [ ] AC-BE-5: 동일 파라미터 백테스팅 2회 호출 시 2회차에 quant_backtest_result에 해당 rows가 존재하여 재계산 없이 반환됨.
- [ ] AC-BE-6: GET /api/quant/performance?from=20220101&to=20221231 호출 시 strategies 배열에 5개 전략 결과가 모두 포함되고, benchmark 시계열이 함께 반환됨.
- [ ] AC-BE-7: GET /api/quant/trades?strategyId=1&from=20220101&to=20221231 호출 시 quant_trade_log rows가 total, page, items 구조로 반환됨.
- [ ] AC-BE-8: POST /api/quant/collect를 USER 토큰으로 호출 시 HTTP 403 반환.
- [ ] AC-BE-9: GET /api/quant/collect/status를 USER 토큰으로 호출 시 HTTP 403 반환.
- [ ] AC-BE-10: QuantDailyCollectScheduler에 `@Scheduled(cron = "0 0 16 * * MON-FRI")` 어노테이션이 존재함.
- [ ] AC-BE-11: MarketDailyPriceMapper.xml의 INSERT 구문에서 close_price 컬럼에 `::numeric` 캐스트가 적용되어 있음.
- [ ] AC-BE-12: 앱 기동 후 quant_strategy 테이블에 5개 row가 존재하며, 재기동 시 중복 INSERT 없이 동일 5개 유지.

### 프론트엔드

- [ ] AC-FE-1: /quant 경로 접속 시 페이지가 렌더링되고, Nav 사이드바에 "퀀트 백테스팅" 메뉴 항목이 표시됨.
- [ ] AC-FE-2: 기간 프리셋 칩 ("최근 1년", "최근 3년", "최근 5년", "전체") 클릭 시 날짜 input 값이 변경되고 API가 재호출됨.
- [ ] AC-FE-3: "전략 비교" 탭에서 5개 전략의 누적 수익률 라인이 모두 차트에 오버레이됨 (KOSPI 벤치마크 포함).
- [ ] AC-FE-4: 개별 전략 탭 클릭 시 totalReturn·mdd·sharpeRatio·totalTrades가 stat-cell 4개에 표시되며, 수치가 IBM Plex Mono 폰트로 렌더링됨.
- [ ] AC-FE-5: PieChart가 currentAllocation 데이터를 기반으로 도넛 형태로 렌더링되고, 각 항목에 assetName과 비율(%)이 표시됨.
- [ ] AC-FE-6: 매매 시그널 테이블에 tradeDate·assetName·tradeType(BUY/SELL 뱃지)·price·weight·reason이 표시됨.
- [ ] AC-FE-7: 타임라인 종목명 클릭 시 assetType==='STOCK'인 항목에 한해 /stock/:code 페이지로 navigate 호출됨.
- [ ] AC-FE-8: API 로딩 중 차트 영역에 `.sk` 스켈레톤이 표시되고 완료 후 실데이터로 교체됨.
- [ ] AC-FE-9: 모바일(768px 미만) 화면에서 전략 탭이 overflow-x-auto로 가로 스크롤 가능하고 EquityChart 높이가 200px임.
- [ ] AC-FE-10: QuantBacktest 컴포넌트가 named export (`export function QuantBacktest`)로 선언되어 있음.
