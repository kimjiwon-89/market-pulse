package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.LearningFeedbackDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantCandidateDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantExitPlanDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantPositionDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantTradeDto;
import com.marketpulse.domain.quant.live.dto.OutcomeCheckpointDto;
import com.marketpulse.domain.quant.live.dto.WatchedAssetDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class BullV4Runtime implements LiveQuantModelRuntime {
    private static final BigDecimal MODEL_SEED = new BigDecimal("100000000");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final Duration QUOTE_CACHE_TTL = Duration.ofSeconds(30);
    private static final Duration REPLAY_CACHE_TTL = Duration.ofMinutes(5);
    private static final Duration EMPTY_REPLAY_CACHE_TTL = Duration.ofSeconds(10);
    private static final String BULL_MODEL_CODE = "BULL_V4";
    private static final BullV4ReplayConfig BULL_CONFIG = BullV4ReplayConfig.BALANCED_PAPER;
    private static final String REALTIME_PROBE_ASSET = "005930";
    private static final LocalDate DAILY_REPORT_MONTH = LocalDate.of(2026, 5, 1);
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final RuleBasedReportWriter reportWriter;
    private final RealtimeQuoteProvider quoteProvider;
    private final HistoricalReplayProvider replayProvider;
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();
    private volatile CachedReplay cachedReplay;

    public BullV4Runtime(
            RuleBasedReportWriter reportWriter,
            RealtimeQuoteProvider quoteProvider,
            HistoricalReplayProvider replayProvider
    ) {
        this.reportWriter = reportWriter;
        this.quoteProvider = quoteProvider;
        this.replayProvider = replayProvider;
    }

    @Override
    public String modelCode() {
        return BULL_MODEL_CODE;
    }

    @Override
    public boolean visible() {
        return true;
    }

    @Override
    public LiveQuantModelSummaryDto summary() {
        List<ReplayTradeFact> facts = replayFacts();
        String bullStatus = quote(REALTIME_PROBE_ASSET).isPresent() && !facts.isEmpty()
                ? "RUNNING"
                : "DATA_DELAYED";
        return model(BULL_MODEL_CODE, "Bull v4 모델", bullStatus, facts);
    }

    @Override
    public LiveQuantModelDetailDto detail() {
        return new LiveQuantModelDetailDto(
                summary(),
                positions(),
                candidates(null),
                trades(),
                exitPlans(),
                watchedAssets(null),
                learningFeedback()
        );
    }

    @Override
    public List<LiveQuantCandidateDto> candidates(String date) {
        return replayFacts().stream()
                .sorted(Comparator.comparing(ReplayTradeFact::entryDate).reversed())
                .limit(10)
                .map(fact -> new LiveQuantCandidateDto(
                        fact.assetCode(),
                        fact.assetName(),
                        fact.entryDate().toString(),
                        "HISTORICAL_REPLAY",
                        "REPLAY_ENTRY",
                        "Bull v4 historical replay entry from market_daily_price.",
                        fact.entryPrice(),
                        fact.returnPct()))
                .toList();
    }

    @Override
    public List<LiveQuantPositionDto> positions() {
        return List.of();
    }

    @Override
    public List<LiveQuantTradeDto> trades() {
        java.util.ArrayList<LiveQuantTradeDto> trades = new java.util.ArrayList<>();
        long id = 1L;
        for (ReplayTradeFact fact : replayFacts()) {
            trades.add(new LiveQuantTradeDto(
                    id++,
                    fact.assetCode(),
                    fact.assetName(),
                    "BUY",
                    fact.entryDate().atTime(9, 1).toString(),
                    fact.entryPrice(),
                    fact.entryPrice(),
                    fact.entryPrice(),
                    "HISTORICAL_REPLAY_CLOSE",
                    ZERO,
                    null,
                    "Bull v4 historical replay entry"));
            trades.add(new LiveQuantTradeDto(
                    id++,
                    fact.assetCode(),
                    fact.assetName(),
                    "SELL",
                    fact.exitDate().atTime(15, 20).toString(),
                    fact.exitPrice(),
                    fact.exitPrice(),
                    fact.exitPrice(),
                    "HISTORICAL_REPLAY_CLOSE",
                    ZERO,
                    fact.returnPct(),
                    "Bull v4 historical replay exit"));
        }
        return trades;
    }

    @Override
    public List<LiveQuantExitPlanDto> exitPlans() {
        return replayFacts().stream()
                .sorted(Comparator.comparing(ReplayTradeFact::exitDate).reversed())
                .limit(10)
                .map(fact -> new LiveQuantExitPlanDto(
                        fact.assetCode(),
                        fact.assetName(),
                        fact.exitDate().toString(),
                        "Historical replay closed by Bull v4 checkpoint/exit rule.",
                        new BigDecimal("-18.00"),
                        new BigDecimal("-20.00"),
                        fact.returnPct()))
                .toList();
    }

    @Override
    public List<LearningFeedbackDto> learningFeedback() {
        List<ReplayTradeFact> facts = replayFacts();
        if (facts.isEmpty()) {
            return List.of();
        }
        long wins = facts.stream().filter(fact -> fact.returnPct().signum() > 0).count();
        BigDecimal winRate = new BigDecimal(wins)
                .multiply(new BigDecimal("100"))
                .divide(new BigDecimal(facts.size()), 2, RoundingMode.HALF_UP);
        return List.of(new LearningFeedbackDto(
                BULL_MODEL_CODE,
                "HISTORICAL_REPLAY_WIN_RATE",
                "Replay win rate " + winRate + "% from " + facts.size() + " completed Bull v4 trades.",
                "Use as baseline only; keep live and historical labels separated.",
                "HISTORICAL_REPLAY"
        ));
    }

    @Override
    public List<WatchedAssetDto> watchedAssets(String date) {
        List<ReplayTradeFact> facts = replayFacts();
        if (date != null && !date.isBlank()) {
            LocalDate target = LocalDate.parse(date, BASIC_DATE);
            facts = facts.stream()
                    .filter(fact -> !fact.entryDate().isAfter(target) && !fact.exitDate().isAfter(target))
                    .toList();
        }
        java.util.ArrayList<WatchedAssetDto> watched = new java.util.ArrayList<>();
        long id = 1L;
        for (ReplayTradeFact fact : facts) {
            watched.add(watched(id++, fact));
        }
        return watched;
    }

    @Override
    public List<OutcomeCheckpointDto> outcomeCheckpoints(Long watchId) {
        return watchedAssets(null).stream()
                .filter(asset -> asset.watchId().equals(watchId))
                .findFirst()
                .map(WatchedAssetDto::checkpoints)
                .orElse(List.of());
    }

    @Override
    public LiveQuantReportDetailDto report(Long reportId) {
        ReportKey key = ReportKey.from(reportId);
        if ("WEEKLY".equals(key.period())) {
            return reportWriter.weeklyReport(reportId, key.reportDate(), BULL_MODEL_CODE, watchedForReport(key));
        }
        return reportWriter.dailyReport(reportId, key.reportDate(), BULL_MODEL_CODE, watchedForReport(key));
    }

    @Override
    public List<LiveQuantReportSummaryDto> reports(String period) {
        String normalizedPeriod = period == null || period.isBlank() ? "WEEKLY" : period;
        if ("DAILY".equalsIgnoreCase(normalizedPeriod)) {
            return dailyReportSummaries();
        }
        return weeklyReportSummaries();
    }

    private List<LiveQuantReportSummaryDto> dailyReportSummaries() {
        return replayFacts().stream()
                .filter(fact -> fact.exitDate().getYear() == DAILY_REPORT_MONTH.getYear()
                        && fact.exitDate().getMonth() == DAILY_REPORT_MONTH.getMonth())
                .collect(java.util.stream.Collectors.groupingBy(ReplayTradeFact::exitDate))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<LocalDate, List<ReplayTradeFact>>comparingByKey().reversed())
                .map(entry -> reportSummary(
                        Long.parseLong(entry.getKey().format(BASIC_DATE)),
                        entry.getKey().format(BASIC_DATE),
                        "DAILY",
                        entry.getValue()))
                .toList();
    }

    private List<LiveQuantReportSummaryDto> weeklyReportSummaries() {
        return replayFacts().stream()
                .collect(java.util.stream.Collectors.groupingBy(fact -> weekKey(fact.exitDate())))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, List<ReplayTradeFact>>comparingByKey().reversed())
                .map(entry -> reportSummary(
                        90_000_000L + Long.parseLong(entry.getKey().replace("W", "")),
                        entry.getKey(),
                        "WEEKLY",
                        entry.getValue()))
                .toList();
    }

    private LiveQuantReportSummaryDto reportSummary(Long reportId, String reportDate, String period, List<ReplayTradeFact> facts) {
        return new LiveQuantReportSummaryDto(
                reportId,
                reportDate,
                period,
                BULL_MODEL_CODE,
                "Bull v4 " + period.toLowerCase(Locale.ROOT) + " replay report",
                aggregateReturnPct(facts),
                facts.size(),
                facts.size(),
                (int) facts.stream().filter(fact -> fact.returnPct().signum() < 0).count(),
                reportDate + "T15:45:00"
        );
    }

    private List<WatchedAssetDto> watchedForReport(ReportKey key) {
        List<ReplayTradeFact> facts = replayFacts();
        if ("DAILY".equals(key.period())) {
            LocalDate date = LocalDate.parse(key.reportDate(), BASIC_DATE);
            facts = facts.stream().filter(fact -> fact.exitDate().equals(date)).toList();
        } else {
            facts = facts.stream().filter(fact -> weekKey(fact.exitDate()).equals(key.reportDate())).toList();
        }
        java.util.ArrayList<WatchedAssetDto> watched = new java.util.ArrayList<>();
        long id = 1L;
        for (ReplayTradeFact fact : facts) {
            watched.add(watched(id++, fact));
        }
        return watched;
    }

    private WatchedAssetDto watched(Long id, ReplayTradeFact fact) {
        return new WatchedAssetDto(
                id,
                BULL_MODEL_CODE,
                fact.assetCode(),
                fact.assetName(),
                fact.source(),
                "REPLAY_CLOSED_TRADE",
                "Bull v4 historical replay trade completed.",
                fact.entryPrice(),
                List.of(new OutcomeCheckpointDto(
                        "EXIT",
                        fact.exitDate().toString(),
                        fact.entryPrice(),
                        fact.exitPrice(),
                        fact.returnPct(),
                        fact.returnPct().max(ZERO),
                        fact.returnPct().min(ZERO).abs(),
                        fact.returnPct().signum() >= 0 ? "PROFITABLE_REPLAY" : "LOSS_REPLAY",
                        fact.assetName() + " historical replay closed at " + fact.returnPct() + "%."
                ))
        );
    }

    private LiveQuantModelSummaryDto model(String code, String name, String status, List<ReplayTradeFact> facts) {
        List<ReplayTradeFact> monthlyFacts = facts.stream()
                .filter(fact -> fact.exitDate().getYear() == DAILY_REPORT_MONTH.getYear()
                        && fact.exitDate().getMonth() == DAILY_REPORT_MONTH.getMonth())
                .toList();
        BigDecimal totalProfit = BULL_MODEL_CODE.equals(code) ? capitalProfit(facts) : ZERO;
        BigDecimal totalReturnPct = BULL_MODEL_CODE.equals(code) ? capitalReturnPct(totalProfit) : ZERO;
        BigDecimal monthlyReturnPct = BULL_MODEL_CODE.equals(code) ? capitalReturnPct(capitalProfit(monthlyFacts)) : ZERO;
        return new LiveQuantModelSummaryDto(
                code,
                BULL_MODEL_CODE.equals(code) ? BULL_CONFIG.modelVersion() : null,
                BULL_MODEL_CODE.equals(code) ? BULL_CONFIG.configKey() : null,
                name,
                "상승장",
                status,
                MODEL_SEED,
                totalReturnPct,
                totalProfit,
                monthlyReturnPct,
                0,
                BULL_MODEL_CODE.equals(code) ? facts.size() : 0,
                BULL_MODEL_CODE.equals(code) ? facts.size() : 0,
                facts.stream().map(ReplayTradeFact::exitDate).max(LocalDate::compareTo)
                        .map(date -> date.atTime(15, 45).toString())
                        .orElse(null)
        );
    }

    private List<ReplayTradeFact> replayFacts() {
        Instant now = Instant.now();
        CachedReplay cached = cachedReplay;
        if (cached != null) {
            Duration ttl = cached.facts().isEmpty() ? EMPTY_REPLAY_CACHE_TTL : REPLAY_CACHE_TTL;
            if (Duration.between(cached.fetchedAt(), now).compareTo(ttl) < 0) {
                return cached.facts();
            }
        }
        List<ReplayTradeFact> facts = replayProvider.bullV4ReplayFacts(replayFrom(), today()).stream()
                .filter(fact -> fact.entryDate() != null && fact.exitDate() != null)
                .filter(fact -> !fact.entryDate().isAfter(today()) && !fact.exitDate().isAfter(today()))
                .sorted(Comparator.comparing(ReplayTradeFact::entryDate))
                .toList();
        cachedReplay = new CachedReplay(facts, now);
        return facts;
    }

    private BigDecimal aggregateReturnPct(List<ReplayTradeFact> facts) {
        if (facts.isEmpty()) {
            return ZERO;
        }
        return facts.stream()
                .map(ReplayTradeFact::returnPct)
                .reduce(ZERO, BigDecimal::add)
                .divide(new BigDecimal(facts.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal capitalProfit(List<ReplayTradeFact> facts) {
        return facts.stream()
                .map(fact -> BULL_CONFIG.positionCash().multiply(fact.returnPct()).divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP))
                .reduce(ZERO, BigDecimal::add);
    }

    private BigDecimal capitalReturnPct(BigDecimal profit) {
        return profit.multiply(ONE_HUNDRED).divide(MODEL_SEED, 2, RoundingMode.HALF_UP);
    }

    private Optional<BigDecimal> quote(String assetCode) {
        CachedQuote cached = quoteCache.get(assetCode);
        Instant now = Instant.now();
        if (cached != null && Duration.between(cached.fetchedAt(), now).compareTo(QUOTE_CACHE_TTL) < 0) {
            return Optional.of(cached.price());
        }
        Optional<BigDecimal> price = quoteProvider.currentPrice(assetCode);
        price.ifPresent(value -> quoteCache.put(assetCode, new CachedQuote(value, now)));
        return price;
    }

    private LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Seoul"));
    }

    private LocalDate replayFrom() {
        return LocalDate.of(today().getYear(), 1, 1);
    }

    private String weekKey(LocalDate date) {
        WeekFields weekFields = WeekFields.ISO;
        return "%04dW%02d".formatted(date.get(weekFields.weekBasedYear()), date.get(weekFields.weekOfWeekBasedYear()));
    }

    private record CachedQuote(BigDecimal price, Instant fetchedAt) {
    }

    private record CachedReplay(List<ReplayTradeFact> facts, Instant fetchedAt) {
    }

    private record ReportKey(String period, String reportDate) {
        private static ReportKey from(Long reportId) {
            String raw = String.valueOf(reportId);
            if (raw.startsWith("90")) {
                String yearWeek = raw.substring(2);
                return new ReportKey("WEEKLY", yearWeek.substring(0, 4) + "W" + yearWeek.substring(4));
            }
            return new ReportKey("DAILY", raw);
        }
    }
}
