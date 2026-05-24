# MP_TREND_CANDLE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two separate candle-chart trend-following strategies, `CANDLE_BREAKOUT_V1` and `CANDLE_PULLBACK_V1`, and compare them with existing MP_CORE backtests.

**Architecture:** Reuse the existing strategy registry, `MarketDailyPriceMapper`, `MonthlyPickVo`, and `simulateMonthlyPicks` engine. Add two strategy components and two look-ahead-safe monthly pick SQL queries based only on OHLCV and index regime data.

**Tech Stack:** Java 17, Spring Boot 3.2, MyBatis XML, PostgreSQL, existing quant backtest service.

---

### Task 1: Strategy Registration Tests

**Files:**
- Create: `market-pulse-api/src/test/java/com/marketpulse/domain/quant/service/strategy/CandleTrendStrategyTest.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/CandleBreakoutStrategy.java`
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/CandlePullbackStrategy.java`

- [ ] **Step 1: Write failing tests**

Create constructor-injected strategy tests with Mockito stubs. Assert `getNameEn()` values and that each strategy delegates to the expected mapper method.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -Dtest=CandleTrendStrategyTest test
```

Expected: fail because strategy classes do not exist.

- [ ] **Step 3: Add minimal strategy classes**

Create `CandleBreakoutStrategy` and `CandlePullbackStrategy` as Spring components extending `AbstractQuantStrategy`.

- [ ] **Step 4: Run test to verify it passes**

Run the same Maven test command. Expected: pass.

### Task 2: Mapper Contract And SQL

**Files:**
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/mapper/MarketDailyPriceMapper.java`
- Modify: `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`

- [ ] **Step 1: Add mapper methods**

Add:

```java
List<MonthlyPickVo> findMonthlyCandleBreakoutPicks(LocalDate fromDate, LocalDate toDate, int topN);
List<MonthlyPickVo> findMonthlyCandlePullbackPicks(LocalDate fromDate, LocalDate toDate, int topN);
```

- [ ] **Step 2: Add SQL queries**

Add two `select` statements returning `MonthlyPickVo` fields. Both must:

- build monthly rebalance and exit dates,
- use signal date strictly before rebalance date,
- compute KOSPI regime from signal-date index rows,
- compute OHLCV lookback metrics from rows at or before signal date,
- rank candidates per rebalance date,
- return top N.

- [ ] **Step 3: Compile MyBatis contracts**

Run:

```bash
cd market-pulse-api
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn -DskipTests compile
```

Expected: compile passes.

### Task 3: Seed Strategies

**Files:**
- Modify: `market-pulse-api/src/main/java/com/marketpulse/domain/quant/runner/QuantStrategyInitRunner.java`

- [ ] **Step 1: Register active strategy rows**

Add:

```text
Candle Breakout / CANDLE_BREAKOUT_V1 / STOCK / MONTHLY
Candle Pullback / CANDLE_PULLBACK_V1 / STOCK / MONTHLY
```

- [ ] **Step 2: Compile**

Run backend compile. Expected: pass.

### Task 4: Verification And Reports

**Files:**
- Modify: `.Codex/status/back-report.md`
- Modify: `.Codex/status/verify-report.md`
- Modify: `.Codex/.logs/2026-05-24-log.md`

- [ ] **Step 1: Run focused test**

Run `CandleTrendStrategyTest`. Expected: pass.

- [ ] **Step 2: Run backend compile**

Run `mvn -DskipTests compile`. Expected: pass.

- [ ] **Step 3: Record reports**

Record what passed and which comparison command/API should be used next to run 2020-2025 strategy comparison.
