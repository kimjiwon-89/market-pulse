package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantCandidateDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantPositionDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantTradeDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class LiveQuantPaperTradingService {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final BigDecimal POSITION_CASH = new BigDecimal("10000000");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal TAKE_PROFIT_PCT = new BigDecimal("7.00");
    private static final BigDecimal STOP_LOSS_PCT = new BigDecimal("-5.00");
    private static final int MAX_HOLD_DAYS = 20;
    private static final int MAX_CANDIDATES_PER_MODEL = 5;
    private static final int MAX_LIQUID_CANDIDATES_PER_MODEL = 3;
    private static final int MAX_REALTIME_SCAN_UNIVERSE = 24;
    private static final int MAX_REALTIME_SCAN_CANDIDATES_PER_MODEL = 6;
    private static final int RANKING_SCAN_LIMIT = 500;
    private static final int LIQUIDITY_SCAN_LIMIT = 200;
    private static final int MAX_MARKET_DATE_STALENESS_DAYS = 3;
    private static final BigDecimal FOLLOW_THROUGH_WATCH_PCT = new BigDecimal("10.00");
    private static final BigDecimal SECONDARY_WATCH_PCT = new BigDecimal("5.00");
    private static final BigDecimal FAILURE_PCT = new BigDecimal("-3.00");

    private final MarketDailyPriceMapper priceMapper;
    private final RealtimeQuoteProvider quoteProvider;
    private final RealtimeStockSnapshotProvider snapshotProvider;
    private final IntradayMonitoringRepository monitoringRepository;
    private final LiveQuantPaperTradingRepository repository;
    private final Clock clock;

    @Autowired
    public LiveQuantPaperTradingService(
            MarketDailyPriceMapper priceMapper,
            RealtimeQuoteProvider quoteProvider,
            RealtimeStockSnapshotProvider snapshotProvider,
            IntradayMonitoringRepository monitoringRepository,
            LiveQuantPaperTradingRepository repository
    ) {
        this(priceMapper, quoteProvider, snapshotProvider, monitoringRepository, repository, Clock.system(KST));
    }

    public LiveQuantPaperTradingService(
            MarketDailyPriceMapper priceMapper,
            RealtimeQuoteProvider quoteProvider,
            LiveQuantPaperTradingRepository repository,
            Clock clock
    ) {
        this(priceMapper, quoteProvider, assetCode -> Optional.empty(), IntradayMonitoringRepository.NOOP, repository, clock);
    }

    public LiveQuantPaperTradingService(
            MarketDailyPriceMapper priceMapper,
            RealtimeQuoteProvider quoteProvider,
            RealtimeStockSnapshotProvider snapshotProvider,
            IntradayMonitoringRepository monitoringRepository,
            LiveQuantPaperTradingRepository repository,
            Clock clock
    ) {
        this.priceMapper = priceMapper;
        this.quoteProvider = quoteProvider;
        this.snapshotProvider = snapshotProvider;
        this.monitoringRepository = monitoringRepository;
        this.repository = repository;
        this.clock = clock;
    }

    public RunResult runOnce() {
        LocalDate signalDate = LocalDate.now(clock.withZone(KST));
        LocalDate marketDate = priceMapper.findLatestStockTradeDateOnOrBefore(signalDate);
        if (marketDate == null) {
            return new RunResult(signalDate, null, 0, 0, 0);
        }

        int sold = closeTriggeredPositions();
        boolean rankingDataStale = isRankingDataStale(signalDate, marketDate);
        List<MarketStockRankingDto> rankingScanRows = priceMapper.findStockRankings(marketDate, "CHANGE_RATE_DESC", RANKING_SCAN_LIMIT);
        List<MarketStockRankingDto> liquidityScanRows = priceMapper.findStockRankings(marketDate, "TRADE_AMOUNT", LIQUIDITY_SCAN_LIMIT);
        List<MarketStockRankingDto> ranked = rankingDataStale ? List.of() : rankingScanRows;
        List<MarketStockRankingDto> liquidRanked = rankingDataStale ? List.of() : liquidityScanRows;
        int candidates = 0;
        int bought = 0;
        Map<String, Optional<RealtimeStockSnapshot>> snapshotCache = new HashMap<>();
        for (ModelSpec spec : ModelSpec.activeBullModels()) {
            List<MarketStockRankingDto> modelCandidates = selectCandidates(spec, ranked, liquidRanked);
            Set<String> buyCandidateAssetCodes = new HashSet<>();
            for (MarketStockRankingDto row : modelCandidates) {
                buyCandidateAssetCodes.add(row.getCode());
                BigDecimal price = quote(row.getCode()).orElse(row.getClosePrice());
                LiveQuantPaperTradingRepository.PaperCandidate candidate = new LiveQuantPaperTradingRepository.PaperCandidate(
                        null,
                        spec.modelCode(),
                        signalDate,
                        marketDate,
                        row.getCode(),
                        row.getName(),
                        "BUY",
                        "최근 거래일 상승률/거래대금 기반 자동 후보",
                        price,
                        safe(row.getChangeRate()),
                        "AUTO_PAPER_INTRADAY"
                );
                repository.upsertCandidate(candidate);
                recordMonitoring(candidate, null, signalDate);
                candidates++;
                if (buyIfNeeded(candidate, price)) {
                    bought++;
                }
            }
            for (LiveQuantPaperTradingRepository.PaperCandidate candidate : realtimeMarketMomentumCandidates(
                    spec,
                    signalDate,
                    marketDate,
                    rankingScanRows,
                    liquidityScanRows,
                    buyCandidateAssetCodes,
                    snapshotCache
            )) {
                repository.upsertCandidate(candidate);
                recordMonitoring(candidate, snapshot(candidate.assetCode(), snapshotCache).orElse(null), signalDate);
                candidates++;
            }
            for (LiveQuantPaperTradingRepository.PaperCandidate candidate : realtimeClusterCandidates(spec, signalDate, marketDate, snapshotCache)) {
                repository.upsertCandidate(candidate);
                recordMonitoring(candidate, snapshot(candidate.assetCode(), snapshotCache).orElse(null), signalDate);
                candidates++;
            }
        }
        log.info("Live quant paper tick: signalDate={}, marketDate={}, candidates={}, bought={}, sold={}",
                signalDate, marketDate, candidates, bought, sold);
        return new RunResult(signalDate, marketDate, candidates, bought, sold);
    }

    private List<MarketStockRankingDto> selectCandidates(
            ModelSpec spec,
            List<MarketStockRankingDto> ranked,
            List<MarketStockRankingDto> liquidRanked
    ) {
        Map<String, MarketStockRankingDto> selected = new LinkedHashMap<>();
        ranked.stream()
                .filter(item -> matchesMarket(spec, item))
                .filter(LiveQuantPaperTradingService::hasTradablePrice)
                .limit(MAX_CANDIDATES_PER_MODEL)
                .forEach(item -> selected.putIfAbsent(item.getCode(), item));
        liquidRanked.stream()
                .filter(item -> matchesMarket(spec, item))
                .filter(LiveQuantPaperTradingService::hasTradablePrice)
                .filter(LiveQuantPaperTradingService::hasPositiveChange)
                .limit(MAX_LIQUID_CANDIDATES_PER_MODEL)
                .forEach(item -> selected.putIfAbsent(item.getCode(), item));
        return List.copyOf(selected.values());
    }

    private List<LiveQuantPaperTradingRepository.PaperCandidate> realtimeMarketMomentumCandidates(
            ModelSpec spec,
            LocalDate signalDate,
            LocalDate marketDate,
            List<MarketStockRankingDto> ranked,
            List<MarketStockRankingDto> liquidRanked,
            Set<String> excludedAssetCodes,
            Map<String, Optional<RealtimeStockSnapshot>> snapshotCache
    ) {
        Map<String, MarketStockRankingDto> universe = new LinkedHashMap<>();
        addRealtimeScanUniverse(universe, spec, ranked, excludedAssetCodes);
        addRealtimeScanUniverse(universe, spec, liquidRanked, excludedAssetCodes);

        return universe.values().stream()
                .map(row -> realtimeMarketCandidate(spec, signalDate, marketDate, row, snapshotCache))
                .flatMap(Optional::stream)
                .sorted(Comparator
                        .comparing((LiveQuantPaperTradingRepository.PaperCandidate item) -> decisionPriority(item.decision()))
                        .thenComparing(LiveQuantPaperTradingRepository.PaperCandidate::expectedReturnPct, Comparator.reverseOrder())
                        .thenComparing(LiveQuantPaperTradingRepository.PaperCandidate::assetCode))
                .limit(MAX_REALTIME_SCAN_CANDIDATES_PER_MODEL)
                .toList();
    }

    private void addRealtimeScanUniverse(
            Map<String, MarketStockRankingDto> universe,
            ModelSpec spec,
            List<MarketStockRankingDto> rows,
            Set<String> excludedAssetCodes
    ) {
        for (MarketStockRankingDto item : rows) {
            if (universe.size() >= MAX_REALTIME_SCAN_UNIVERSE) {
                return;
            }
            if (!matchesMarket(spec, item)) {
                continue;
            }
            if (excludedAssetCodes.contains(item.getCode()) || ClusterMember.isSpecialClusterAsset(item.getCode())) {
                continue;
            }
            universe.putIfAbsent(item.getCode(), item);
        }
    }

    private Optional<LiveQuantPaperTradingRepository.PaperCandidate> realtimeMarketCandidate(
            ModelSpec spec,
            LocalDate signalDate,
            LocalDate marketDate,
            MarketStockRankingDto row,
            Map<String, Optional<RealtimeStockSnapshot>> snapshotCache
    ) {
        Optional<RealtimeStockSnapshot> maybeSnapshot = snapshot(row.getCode(), snapshotCache);
        if (maybeSnapshot.isEmpty()) {
            return Optional.empty();
        }
        RealtimeStockSnapshot realtime = maybeSnapshot.get();
        if (!matchesMarket(spec, realtime, row)) {
            return Optional.empty();
        }
        ClusterDecision decision = classifyRealtimeMarketMomentum(spec, realtime);
        if (decision == null) {
            return Optional.empty();
        }
        return Optional.of(new LiveQuantPaperTradingRepository.PaperCandidate(
                null,
                spec.modelCode(),
                signalDate,
                signalDate != null ? signalDate : marketDate,
                realtime.assetCode(),
                firstNonBlank(realtime.assetName(), row.getName()),
                decision.decision(),
                decision.reason(),
                realtime.currentPrice(),
                safe(realtime.changeRate()),
                "AUTO_PAPER_REALTIME_SCAN"
        ));
    }

    private ClusterDecision classifyRealtimeMarketMomentum(ModelSpec spec, RealtimeStockSnapshot snapshot) {
        BigDecimal changeRate = safe(snapshot.changeRate());
        String prefix = spec.market() + "_REALTIME_MOMENTUM";
        if (changeRate.compareTo(FOLLOW_THROUGH_WATCH_PCT) >= 0) {
            return new ClusterDecision("HOT", prefix + " HOT: live momentum +" + changeRate + "%");
        }
        if (changeRate.compareTo(SECONDARY_WATCH_PCT) >= 0) {
            return new ClusterDecision("WATCH", prefix + " WATCH: live momentum +" + changeRate + "%");
        }
        if (changeRate.compareTo(FAILURE_PCT) <= 0) {
            return new ClusterDecision("WARNING", prefix + " WARNING: live drawdown " + changeRate + "%");
        }
        return null;
    }

    private List<LiveQuantPaperTradingRepository.PaperCandidate> realtimeClusterCandidates(
            ModelSpec spec,
            LocalDate signalDate,
            LocalDate marketDate,
            Map<String, Optional<RealtimeStockSnapshot>> snapshotCache
    ) {
        List<LiveQuantPaperTradingRepository.PaperCandidate> candidates = new ArrayList<>();
        for (ClusterMember member : ClusterMember.lgSecondDayCluster()) {
            if (!spec.market().equals(member.market())) {
                continue;
            }
            Optional<RealtimeStockSnapshot> snapshot = snapshot(member.assetCode(), snapshotCache);
            if (snapshot.isEmpty()) {
                continue;
            }
            ClusterDecision decision = classifyClusterMember(member, snapshot.get());
            if (decision == null) {
                continue;
            }
            candidates.add(new LiveQuantPaperTradingRepository.PaperCandidate(
                    null,
                    spec.modelCode(),
                    signalDate,
                    signalDate != null ? signalDate : marketDate,
                    snapshot.get().assetCode(),
                    firstNonBlank(snapshot.get().assetName(), member.assetName()),
                    decision.decision(),
                    decision.reason(),
                    snapshot.get().currentPrice(),
                    safe(snapshot.get().changeRate()),
                    "AUTO_PAPER_REALTIME_CLUSTER"
            ));
        }
        return candidates.stream()
                .sorted(Comparator.comparing(LiveQuantPaperTradingRepository.PaperCandidate::assetCode))
                .toList();
    }

    private ClusterDecision classifyClusterMember(ClusterMember member, RealtimeStockSnapshot snapshot) {
        BigDecimal changeRate = safe(snapshot.changeRate());
        if (changeRate.compareTo(FOLLOW_THROUGH_WATCH_PCT) >= 0) {
            return new ClusterDecision("HOT", member.cluster() + " FOLLOW_THROUGH_WATCH: realtime cluster member +" + changeRate + "%");
        }
        if (changeRate.compareTo(SECONDARY_WATCH_PCT) >= 0) {
            return new ClusterDecision("WATCH", member.cluster() + " SECONDARY_WATCH: realtime cluster member +" + changeRate + "%");
        }
        if (member.leader() && changeRate.signum() < 0) {
            return new ClusterDecision("COOLDOWN", member.cluster() + " LEADER_PULLBACK_COOLDOWN: previous leader is negative today");
        }
        if (changeRate.compareTo(FAILURE_PCT) <= 0) {
            return new ClusterDecision("WARNING", member.cluster() + " THEME_FOLLOW_FAILURE: realtime cluster member " + changeRate + "%");
        }
        return null;
    }

    public List<LiveQuantCandidateDto> candidates(String modelCode, LocalDate signalDate) {
        return repository.findCandidates(modelCode, signalDate).stream()
                .filter(item -> !isStaleRankingCandidate(item))
                .map(item -> new LiveQuantCandidateDto(
                        item.assetCode(),
                        item.assetName(),
                        item.signalDate().toString(),
                        item.source(),
                        item.decision(),
                        item.reason(),
                        item.signalPrice(),
                        item.expectedReturnPct()
                ))
                .toList();
    }

    private static boolean isStaleRankingCandidate(LiveQuantPaperTradingRepository.PaperCandidate candidate) {
        return "AUTO_PAPER_INTRADAY".equals(candidate.source())
                && isRankingDataStale(candidate.signalDate(), candidate.marketDate());
    }

    public List<LiveQuantPositionDto> positions(String modelCode) {
        return repository.findOpenPositions(modelCode).stream()
                .map(position -> {
                    BigDecimal current = quote(position.assetCode()).orElse(position.entryPrice());
                    return new LiveQuantPositionDto(
                            position.assetCode(),
                            position.assetName(),
                            position.entryTime().toString(),
                            position.entryPrice(),
                            current,
                            returnPct(position.entryPrice(), current),
                            TAKE_PROFIT_PCT,
                            "익절 +" + TAKE_PROFIT_PCT + "% / 손절 " + STOP_LOSS_PCT + "% / 최대 " + MAX_HOLD_DAYS + "일"
                    );
                })
                .toList();
    }

    public List<LiveQuantTradeDto> trades(String modelCode) {
        return repository.findTrades(modelCode).stream()
                .map(trade -> new LiveQuantTradeDto(
                        trade.tradeId(),
                        trade.assetCode(),
                        trade.assetName(),
                        trade.side(),
                        trade.fillTime().toString(),
                        trade.signalPrice(),
                        trade.fillPrice(),
                        trade.fillPrice(),
                        trade.source(),
                        BigDecimal.ZERO,
                        trade.realizedReturnPct(),
                        trade.reason()
                ))
                .toList();
    }

    private int closeTriggeredPositions() {
        int sold = 0;
        Instant now = clock.instant();
        for (LiveQuantPaperTradingRepository.PaperPosition position : repository.findOpenPositions(null)) {
            BigDecimal current = quote(position.assetCode()).orElse(position.entryPrice());
            BigDecimal pct = returnPct(position.entryPrice(), current);
            long heldDays = Math.max(0, ChronoUnit.DAYS.between(position.entryTime(), now));
            String reason = exitReason(pct, heldDays);
            if (reason == null) {
                continue;
            }
            repository.insertTrade(new LiveQuantPaperTradingRepository.PaperTrade(
                    null,
                    position.modelCode(),
                    position.positionId(),
                    position.assetCode(),
                    position.assetName(),
                    "SELL",
                    now,
                    current,
                    current,
                    position.quantity(),
                    pct,
                    reason,
                    "AUTO_PAPER_INTRADAY"
            ));
            repository.closePosition(position.positionId());
            sold++;
        }
        return sold;
    }

    private boolean buyIfNeeded(LiveQuantPaperTradingRepository.PaperCandidate candidate, BigDecimal price) {
        if (!"BUY".equals(candidate.decision())) {
            return false;
        }
        if (price == null || price.signum() <= 0) {
            return false;
        }
        if (repository.findOpenPosition(candidate.modelCode(), candidate.assetCode()).isPresent()) {
            return false;
        }
        long quantity = POSITION_CASH.divide(price, 0, RoundingMode.DOWN).longValue();
        if (quantity <= 0) {
            return false;
        }
        Instant now = clock.instant();
        repository.openPosition(new LiveQuantPaperTradingRepository.PaperPosition(
                null,
                candidate.modelCode(),
                candidate.assetCode(),
                candidate.assetName(),
                now,
                price,
                quantity,
                "OPEN"
        ));
        repository.insertTrade(new LiveQuantPaperTradingRepository.PaperTrade(
                null,
                candidate.modelCode(),
                null,
                candidate.assetCode(),
                candidate.assetName(),
                "BUY",
                now,
                candidate.signalPrice(),
                price,
                quantity,
                null,
                candidate.reason(),
                candidate.source()
        ));
        return true;
    }

    private Optional<BigDecimal> quote(String assetCode) {
        try {
            return quoteProvider.currentPrice(assetCode);
        } catch (Exception e) {
            log.warn("Paper quote fallback failed for assetCode={}: {}", assetCode, e.getMessage());
            return Optional.empty();
        }
    }

    private String exitReason(BigDecimal pct, long heldDays) {
        if (pct.compareTo(TAKE_PROFIT_PCT) >= 0) {
            return "AUTO_TAKE_PROFIT";
        }
        if (pct.compareTo(STOP_LOSS_PCT) <= 0) {
            return "AUTO_STOP_LOSS";
        }
        if (heldDays >= MAX_HOLD_DAYS) {
            return "AUTO_MAX_HOLD_DAYS";
        }
        return null;
    }

    private BigDecimal returnPct(BigDecimal entryPrice, BigDecimal currentPrice) {
        if (entryPrice == null || entryPrice.signum() == 0 || currentPrice == null) {
            return BigDecimal.ZERO;
        }
        return currentPrice.subtract(entryPrice)
                .multiply(ONE_HUNDRED)
                .divide(entryPrice, 2, RoundingMode.HALF_UP);
    }

    private static boolean matchesMarket(ModelSpec spec, MarketStockRankingDto row) {
        String market = row.getMarket();
        if (market == null || market.isBlank()) {
            return "KOSPI".equals(spec.market());
        }
        return market.toUpperCase().contains(spec.market());
    }

    private static boolean matchesMarket(ModelSpec spec, RealtimeStockSnapshot snapshot, MarketStockRankingDto fallback) {
        String market = snapshot.market();
        if (market == null || market.isBlank()) {
            return matchesMarket(spec, fallback);
        }
        String upperMarket = market.toUpperCase();
        if (upperMarket.contains("KOSPI") || upperMarket.contains("KOSDAQ")) {
            return upperMarket.contains(spec.market());
        }
        return matchesMarket(spec, fallback);
    }

    private static int decisionPriority(String decision) {
        return switch (decision) {
            case "HOT" -> 0;
            case "WATCH" -> 1;
            case "WARNING" -> 2;
            case "COOLDOWN" -> 3;
            default -> 4;
        };
    }

    private Optional<RealtimeStockSnapshot> snapshot(String assetCode) {
        try {
            return snapshotProvider.currentSnapshot(assetCode);
        } catch (Exception e) {
            log.warn("Paper realtime snapshot failed for assetCode={}: {}", assetCode, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<RealtimeStockSnapshot> snapshot(String assetCode, Map<String, Optional<RealtimeStockSnapshot>> cache) {
        return cache.computeIfAbsent(assetCode, this::snapshot);
    }

    private void recordMonitoring(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            RealtimeStockSnapshot snapshot,
            LocalDate signalDate
    ) {
        try {
            monitoringRepository.record(candidate, snapshot, signalDate, clock.instant());
        } catch (Exception e) {
            log.warn("Intraday monitoring persistence failed for assetCode={}: {}", candidate.assetCode(), e.getMessage());
        }
    }

    private static boolean hasTradablePrice(MarketStockRankingDto row) {
        return row.getClosePrice() != null && row.getClosePrice().signum() > 0;
    }

    private static boolean hasPositiveChange(MarketStockRankingDto row) {
        return row.getChangeRate() != null && row.getChangeRate().signum() > 0;
    }

    private static BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static boolean isRankingDataStale(LocalDate signalDate, LocalDate marketDate) {
        if (signalDate == null || marketDate == null) {
            return false;
        }
        return ChronoUnit.DAYS.between(marketDate, signalDate) > MAX_MARKET_DATE_STALENESS_DAYS;
    }

    private static String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record RunResult(
            LocalDate signalDate,
            LocalDate marketDate,
            int candidateCount,
            int boughtCount,
            int soldCount
    ) {
    }

    private record ModelSpec(String modelCode, String market) {
        static List<ModelSpec> activeBullModels() {
            return List.of(
                    new ModelSpec("KOSPI_BULL", "KOSPI"),
                    new ModelSpec("KOSDAQ_BULL", "KOSDAQ")
            );
        }
    }

    private record ClusterMember(String assetCode, String assetName, String market, String cluster, boolean leader) {
        static boolean isSpecialClusterAsset(String assetCode) {
            return lgSecondDayCluster().stream()
                    .anyMatch(item -> item.assetCode().equals(assetCode));
        }

        static List<ClusterMember> lgSecondDayCluster() {
            return List.of(
                    new ClusterMember("066570", "LG전자", "KOSPI", "LG_NEXT_DAY_CLUSTER", true),
                    new ClusterMember("066575", "LG전자우", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("037560", "LG헬로비전", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("003550", "LG", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("003555", "LG우", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("011070", "LG이노텍", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("034220", "LG디스플레이", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("064400", "LG씨엔에스", "KOSPI", "LG_NEXT_DAY_CLUSTER", false),
                    new ClusterMember("032640", "LG유플러스", "KOSPI", "LG_NEXT_DAY_CLUSTER", false)
            );
        }
    }

    private record ClusterDecision(String decision, String reason) {
    }
}
