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
import java.util.List;
import java.util.Optional;

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
    private static final int RANKING_SCAN_LIMIT = 500;

    private final MarketDailyPriceMapper priceMapper;
    private final RealtimeQuoteProvider quoteProvider;
    private final LiveQuantPaperTradingRepository repository;
    private final Clock clock;

    @Autowired
    public LiveQuantPaperTradingService(
            MarketDailyPriceMapper priceMapper,
            RealtimeQuoteProvider quoteProvider,
            LiveQuantPaperTradingRepository repository
    ) {
        this(priceMapper, quoteProvider, repository, Clock.system(KST));
    }

    public LiveQuantPaperTradingService(
            MarketDailyPriceMapper priceMapper,
            RealtimeQuoteProvider quoteProvider,
            LiveQuantPaperTradingRepository repository,
            Clock clock
    ) {
        this.priceMapper = priceMapper;
        this.quoteProvider = quoteProvider;
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
        List<MarketStockRankingDto> ranked = priceMapper.findStockRankings(marketDate, "CHANGE_RATE_DESC", RANKING_SCAN_LIMIT);
        int candidates = 0;
        int bought = 0;
        for (ModelSpec spec : ModelSpec.activeBullModels()) {
            List<MarketStockRankingDto> modelCandidates = ranked.stream()
                    .filter(item -> matchesMarket(spec, item))
                    .filter(item -> item.getClosePrice() != null && item.getClosePrice().signum() > 0)
                    .limit(MAX_CANDIDATES_PER_MODEL)
                    .toList();
            for (MarketStockRankingDto row : modelCandidates) {
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
                candidates++;
                if (buyIfNeeded(candidate, price)) {
                    bought++;
                }
            }
        }
        log.info("Live quant paper tick: signalDate={}, marketDate={}, candidates={}, bought={}, sold={}",
                signalDate, marketDate, candidates, bought, sold);
        return new RunResult(signalDate, marketDate, candidates, bought, sold);
    }

    public List<LiveQuantCandidateDto> candidates(String modelCode, LocalDate signalDate) {
        return repository.findCandidates(modelCode, signalDate).stream()
                .map(item -> new LiveQuantCandidateDto(
                        item.assetCode(),
                        item.assetName(),
                        item.signalDate().toString(),
                        "AUTO_PAPER",
                        item.decision(),
                        item.reason(),
                        item.signalPrice(),
                        item.expectedReturnPct()
                ))
                .toList();
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

    private static BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
}
