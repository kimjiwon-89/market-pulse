# MTF Candle Trend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and tune `CANDLE_MTF_TREND_V2` toward 15% average monthly return, then verify whether the result survives the full available dataset.

**Architecture:** Add an event-driven candle strategy path instead of forcing monthly portfolio turnover. The first implementation will use existing daily OHLCV and chart feature snapshots for monthly/weekly/daily context, record `NO_MINUTE_DATA` for unavailable historical minute bars, and support short holding windows so backtests can search aggressive trend-following variants.

**Tech Stack:** Java 17, Spring Boot 3.2, MyBatis XML, PostgreSQL, JUnit 5, AssertJ.

---

### Task 1: Contract Tests

**Files:**
- Modify: `market-pulse-api/src/test/java/com/marketpulse/domain/quant/service/strategy/CandleTrendStrategyTest.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`

- [ ] **Step 1: Write failing tests**

Add tests asserting that `CandleMtfTrendStrategy` returns `CANDLE_MTF_TREND_V2`, calls `findEventDrivenCandleMtfTrendPicks`, and that `MarketDailyPriceMapper` exposes the method signature:

```java
List<MonthlyPickVo> findEventDrivenCandleMtfTrendPicks(LocalDate fromDate, LocalDate toDate, int topN, int holdDays);
```

- [ ] **Step 2: Run red test**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test
```

Expected: FAIL because the strategy class and mapper method do not exist.

### Task 2: Strategy Shell

**Files:**
- Create: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/CandleMtfTrendStrategy.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/runner/QuantStrategyInitRunner.java`

- [ ] **Step 1: Add mapper method**

Add `findEventDrivenCandleMtfTrendPicks(LocalDate fromDate, LocalDate toDate, int topN, int holdDays)`.

- [ ] **Step 2: Add strategy class**

Create `CandleMtfTrendStrategy`, `TOP_N = 3`, `HOLD_DAYS = 5`, and delegate to the new mapper method.

- [ ] **Step 3: Register strategy**

Register `CANDLE_MTF_TREND_V2` with rebalance cycle `EVENT`.

- [ ] **Step 4: Run green test**

Run the same focused test. Expected: PASS.

### Task 3: MTF Pick SQL

**Files:**
- Modify: `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`

- [ ] **Step 1: Add MyBatis SQL**

Add `findEventDrivenCandleMtfTrendPicks` using `quant_candle_feature_snapshot` only. It must:

- scan daily signal dates, not month starts.
- use `signal_date < execution_date`.
- use `holdDays` to select exit date.
- score monthly/weekly/daily trend proxies.
- include high-conviction candle filters.
- return top `topN` per signal date.

- [ ] **Step 2: Validate XML**

Run:

```bash
xmllint --noout --nonet market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml
```

Expected: PASS.

### Task 4: Compile And Compare

**Files:**
- Modify: `.Codex/reports/2026-05-24_mtf-candle-trend-backtest.md`
- Modify: `.Codex/status/verify-report.md`
- Modify: `.Codex/.logs/2026-05-24-log.md`

- [ ] **Step 1: Compile**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile
```

Expected: PASS.

- [ ] **Step 2: Run tuning backtests**

Run SQL/API comparison for 2022-05-01 through 2025-06-30 first. Target metric is average monthly return, with no-trade months counted as 0%.

- [ ] **Step 3: If a variant reaches 15% average monthly return**

Run the same strategy on the full available dataset. Record whether the target survives.

- [ ] **Step 4: If no variant reaches 15%**

Record best honest result, why 15% failed, and next bottleneck.

