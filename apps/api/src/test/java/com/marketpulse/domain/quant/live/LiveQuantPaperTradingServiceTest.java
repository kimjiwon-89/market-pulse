package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.live.service.IntradayMonitoringRepository;
import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingRepository;
import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingService;
import com.marketpulse.domain.quant.live.service.RealtimeQuoteProvider;
import com.marketpulse.domain.quant.live.service.RealtimeStockSnapshot;
import com.marketpulse.domain.quant.live.service.RealtimeStockSnapshotProvider;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LiveQuantPaperTradingServiceTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-31T01:00:00Z"), ZoneId.of("Asia/Seoul"));

    @Test
    void runOnceBuysTopCandidateWhenNoOpenPositionExists() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 29));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(ranking("005930", "삼성전자", "KOSPI", "10000", "4.20")));

        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of());

        FakeRepository repository = new FakeRepository();
        RealtimeQuoteProvider quoteProvider = code -> Optional.of(new BigDecimal("10000"));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(priceMapper, quoteProvider, repository, CLOCK);

        LiveQuantPaperTradingService.RunResult result = service.runOnce();

        assertThat(result.boughtCount()).isEqualTo(1);
        assertThat(repository.candidates).singleElement().satisfies(candidate -> {
            assertThat(candidate.modelCode()).isEqualTo("KOSPI_BULL");
            assertThat(candidate.assetCode()).isEqualTo("005930");
            assertThat(candidate.signalDate()).isEqualTo(LocalDate.of(2026, 5, 31));
        });
        assertThat(repository.positions).singleElement().satisfies(position -> {
            assertThat(position.modelCode()).isEqualTo("KOSPI_BULL");
            assertThat(position.quantity()).isEqualTo(1000L);
            assertThat(position.entryPrice()).isEqualByComparingTo("10000");
        });
        assertThat(repository.trades).singleElement().satisfies(trade -> {
            assertThat(trade.side()).isEqualTo("BUY");
            assertThat(trade.quantity()).isEqualTo(1000L);
        });
    }

    @Test
    void runOnceIncludesLargeLiquidMoverOutsideChangeRateTopFive() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 6, 1));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 1)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(
                        ranking("001740", "SK네트웍스", "KOSPI", "10920", "30.00"),
                        ranking("001820", "삼화콘덴서", "KOSPI", "132600", "30.00"),
                        ranking("019180", "티에이치엔", "KOSPI", "9680", "29.93"),
                        ranking("011230", "삼화전자", "KOSPI", "3480", "29.85"),
                        ranking("003720", "삼영", "KOSPI", "13250", "23.83")
                ));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 1)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of(
                        ranking("005930", "삼성전자", "KOSPI", "299000", "2.22"),
                        ranking("066570", "LG전자", "KOSPI", "239500", "1.05")
                ));

        FakeRepository repository = new FakeRepository();
        RealtimeQuoteProvider quoteProvider = code -> Optional.of(new BigDecimal("10000"));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(priceMapper, quoteProvider, repository, CLOCK);

        service.runOnce();

        assertThat(repository.candidates)
                .extracting(LiveQuantPaperTradingRepository.PaperCandidate::assetCode)
                .contains("005930", "066570");
        verify(priceMapper).findStockRankings(eq(LocalDate.of(2026, 6, 1)), eq("TRADE_AMOUNT"), anyInt());
    }

    @Test
    void runOnceBlocksStaleRankingCandidatesButKeepsRealtimeClusterWatch() {
        Clock juneSecond = Clock.fixed(Instant.parse("2026-06-02T01:50:00Z"), ZoneId.of("Asia/Seoul"));
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 26));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 26)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(ranking("001740", "SK네트웍스", "KOSPI", "11760", "30.00")));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 26)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of(ranking("005930", "삼성전자", "KOSPI", "356000", "2.22")));

        FakeRepository repository = new FakeRepository();
        RealtimeStockSnapshotProvider snapshotProvider = snapshotProvider(List.of(
                snapshot("037560", "LG헬로비전", "KOSPI", "3300", "15.38", 105_384_057_176L),
                snapshot("066570", "LG전자", "KOSPI", "361500", "-4.99", 2_223_961_612_500L)
        ));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(
                priceMapper,
                code -> Optional.of(new BigDecimal("10000")),
                snapshotProvider,
                IntradayMonitoringRepository.NOOP,
                repository,
                juneSecond
        );

        LiveQuantPaperTradingService.RunResult result = service.runOnce();

        assertThat(result.marketDate()).isEqualTo(LocalDate.of(2026, 5, 26));
        assertThat(repository.candidates)
                .extracting(LiveQuantPaperTradingRepository.PaperCandidate::assetCode)
                .containsExactlyInAnyOrder("037560", "066570");
        assertThat(repository.candidates)
                .noneMatch(candidate -> candidate.source().equals("AUTO_PAPER_INTRADAY"));
        assertThat(repository.trades).isEmpty();
    }

    @Test
    void runOnceScansKosdaqRealtimeMomentumWhenDailyRankingDataIsStale() {
        Clock juneSecond = Clock.fixed(Instant.parse("2026-06-02T01:50:00Z"), ZoneId.of("Asia/Seoul"));
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 26));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 26)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(
                        ranking("356860", "TLB", "KOSDAQ", "87500", "10.17"),
                        ranking("031330", "SAMT", "KOSDAQ", "7400", "8.10")
                ));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 26)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of(
                        ranking("034220", "LG Display", "KOSPI", "16700", "5.70"),
                        ranking("356860", "TLB", "KOSDAQ", "87500", "10.17")
                ));

        FakeRepository repository = new FakeRepository();
        RealtimeStockSnapshotProvider snapshotProvider = snapshotProvider(List.of(
                snapshot("356860", "TLB", "KOSDAQ", "92200", "11.80", 52_000_000_000L),
                snapshot("031330", "SAMT", "KOSDAQ", "7200", "-3.40", 18_000_000_000L)
        ));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(
                priceMapper,
                code -> Optional.of(new BigDecimal("10000")),
                snapshotProvider,
                IntradayMonitoringRepository.NOOP,
                repository,
                juneSecond
        );

        service.runOnce();

        assertThat(repository.candidates)
                .filteredOn(candidate -> candidate.modelCode().equals("KOSDAQ_BULL"))
                .extracting(LiveQuantPaperTradingRepository.PaperCandidate::assetCode)
                .containsExactlyInAnyOrder("356860", "031330");
        assertThat(repository.candidates)
                .filteredOn(candidate -> candidate.assetCode().equals("356860"))
                .singleElement()
                .satisfies(candidate -> {
                    assertThat(candidate.source()).isEqualTo("AUTO_PAPER_REALTIME_SCAN");
                    assertThat(candidate.decision()).isEqualTo("HOT");
                });
        assertThat(repository.trades).isEmpty();
    }

    @Test
    void runOnceDoesNotOverwriteFreshBuyCandidateWithRealtimeScanState() {
        Clock juneSecond = Clock.fixed(Instant.parse("2026-06-02T01:50:00Z"), ZoneId.of("Asia/Seoul"));
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 6, 2));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 2)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(ranking("356860", "TLB", "KOSDAQ", "87500", "10.17")));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 2)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of());

        FakeRepository repository = new FakeRepository();
        RealtimeStockSnapshotProvider snapshotProvider = snapshotProvider(List.of(
                snapshot("356860", "TLB", "KOSDAQ", "92200", "11.80", 52_000_000_000L)
        ));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(
                priceMapper,
                code -> Optional.of(new BigDecimal("92200")),
                snapshotProvider,
                IntradayMonitoringRepository.NOOP,
                repository,
                juneSecond
        );

        service.runOnce();

        assertThat(repository.candidates)
                .filteredOn(candidate -> candidate.modelCode().equals("KOSDAQ_BULL"))
                .singleElement()
                .satisfies(candidate -> {
                    assertThat(candidate.assetCode()).isEqualTo("356860");
                    assertThat(candidate.source()).isEqualTo("AUTO_PAPER_INTRADAY");
                    assertThat(candidate.decision()).isEqualTo("BUY");
                });
    }

    @Test
    void runOnceClassifiesLgClusterFollowThroughAndFailures() {
        Clock juneSecond = Clock.fixed(Instant.parse("2026-06-02T01:50:00Z"), ZoneId.of("Asia/Seoul"));
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 6, 2));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 2)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of());
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 6, 2)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of());

        FakeRepository repository = new FakeRepository();
        RealtimeStockSnapshotProvider snapshotProvider = snapshotProvider(List.of(
                snapshot("037560", "LG헬로비전", "KOSPI", "3300", "15.38", 105_384_057_176L),
                snapshot("034220", "LG디스플레이", "KOSPI", "16700", "5.70", 757_072_192_205L),
                snapshot("011070", "LG이노텍", "KOSPI", "1204000", "-21.31", 656_481_849_500L)
        ));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(
                priceMapper,
                code -> Optional.of(new BigDecimal("10000")),
                snapshotProvider,
                IntradayMonitoringRepository.NOOP,
                repository,
                juneSecond
        );

        service.runOnce();

        assertThat(repository.candidates)
                .filteredOn(candidate -> candidate.assetCode().equals("037560"))
                .singleElement()
                .satisfies(candidate -> {
                    assertThat(candidate.decision()).isEqualTo("HOT");
                    assertThat(candidate.reason()).contains("FOLLOW_THROUGH_WATCH");
                    assertThat(candidate.expectedReturnPct()).isEqualByComparingTo("15.38");
                });
        assertThat(repository.candidates)
                .filteredOn(candidate -> candidate.assetCode().equals("011070"))
                .singleElement()
                .satisfies(candidate -> {
                    assertThat(candidate.decision()).isEqualTo("WARNING");
                    assertThat(candidate.reason()).contains("THEME_FOLLOW_FAILURE");
                });
        assertThat(repository.trades).isEmpty();
    }

    @Test
    void candidatesHideStaleRankingRowsButKeepRealtimeClusterRows() {
        FakeRepository repository = new FakeRepository();
        repository.candidates.add(new LiveQuantPaperTradingRepository.PaperCandidate(
                null,
                "KOSPI_BULL",
                LocalDate.of(2026, 6, 2),
                LocalDate.of(2026, 5, 26),
                "005930",
                "삼성전자",
                "BUY",
                "stale ranking",
                new BigDecimal("350000"),
                new BigDecimal("2.22"),
                "AUTO_PAPER_INTRADAY"
        ));
        repository.candidates.add(new LiveQuantPaperTradingRepository.PaperCandidate(
                null,
                "KOSPI_BULL",
                LocalDate.of(2026, 6, 2),
                LocalDate.of(2026, 6, 2),
                "037560",
                "LG헬로비전",
                "HOT",
                "realtime cluster",
                new BigDecimal("3300"),
                new BigDecimal("15.38"),
                "AUTO_PAPER_REALTIME_CLUSTER"
        ));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(
                mock(MarketDailyPriceMapper.class),
                code -> Optional.empty(),
                repository,
                CLOCK
        );

        List<String> codes = service.candidates("KOSPI_BULL", LocalDate.of(2026, 6, 2)).stream()
                .map(com.marketpulse.domain.quant.live.dto.LiveQuantCandidateDto::assetCode)
                .toList();

        assertThat(codes).containsExactly("037560");
    }

    @Test
    void runOnceSellsOpenPositionWhenStopLossIsHit() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 29));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of());
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("TRADE_AMOUNT"), anyInt()))
                .thenReturn(List.of());

        FakeRepository repository = new FakeRepository();
        repository.positions.add(new LiveQuantPaperTradingRepository.PaperPosition(
                10L,
                "KOSPI_BULL",
                "005930",
                "삼성전자",
                CLOCK.instant().minusSeconds(86_400),
                new BigDecimal("10000"),
                100L,
                "OPEN"
        ));
        RealtimeQuoteProvider quoteProvider = code -> Optional.of(new BigDecimal("9400"));
        LiveQuantPaperTradingService service = new LiveQuantPaperTradingService(priceMapper, quoteProvider, repository, CLOCK);

        LiveQuantPaperTradingService.RunResult result = service.runOnce();

        assertThat(result.soldCount()).isEqualTo(1);
        assertThat(repository.positions).isEmpty();
        assertThat(repository.trades).singleElement().satisfies(trade -> {
            assertThat(trade.side()).isEqualTo("SELL");
            assertThat(trade.fillPrice()).isEqualByComparingTo("9400");
            assertThat(trade.realizedReturnPct()).isEqualByComparingTo("-6.00");
        });
    }

    private MarketStockRankingDto ranking(String code, String name, String market, String closePrice, String changeRate) {
        MarketStockRankingDto dto = new MarketStockRankingDto();
        dto.setCode(code);
        dto.setName(name);
        dto.setMarket(market);
        dto.setClosePrice(new BigDecimal(closePrice));
        dto.setChangeRate(new BigDecimal(changeRate));
        dto.setTradeDate(LocalDate.of(2026, 5, 29));
        return dto;
    }

    private RealtimeStockSnapshot snapshot(
            String code,
            String name,
            String market,
            String currentPrice,
            String changeRate,
            long tradingValue
    ) {
        return new RealtimeStockSnapshot(
                code,
                name,
                market,
                new BigDecimal(currentPrice),
                new BigDecimal(changeRate),
                tradingValue
        );
    }

    private RealtimeStockSnapshotProvider snapshotProvider(List<RealtimeStockSnapshot> snapshots) {
        return assetCode -> snapshots.stream()
                .filter(snapshot -> snapshot.assetCode().equals(assetCode))
                .findFirst();
    }

    private static class FakeRepository implements LiveQuantPaperTradingRepository {
        private final List<PaperCandidate> candidates = new ArrayList<>();
        private final List<PaperPosition> positions = new ArrayList<>();
        private final List<PaperTrade> trades = new ArrayList<>();

        @Override
        public void upsertCandidate(PaperCandidate candidate) {
            candidates.add(candidate);
        }

        @Override
        public List<PaperCandidate> findCandidates(String modelCode, LocalDate signalDate) {
            return candidates.stream()
                    .filter(item -> item.modelCode().equals(modelCode))
                    .filter(item -> signalDate == null || item.signalDate().equals(signalDate))
                    .toList();
        }

        @Override
        public List<PaperPosition> findOpenPositions(String modelCode) {
            return positions.stream()
                    .filter(item -> modelCode == null || item.modelCode().equals(modelCode))
                    .toList();
        }

        @Override
        public Optional<PaperPosition> findOpenPosition(String modelCode, String assetCode) {
            return positions.stream()
                    .filter(item -> item.modelCode().equals(modelCode) && item.assetCode().equals(assetCode))
                    .findFirst();
        }

        @Override
        public void openPosition(PaperPosition position) {
            positions.add(position);
        }

        @Override
        public void closePosition(long positionId) {
            positions.removeIf(item -> item.positionId() == positionId);
        }

        @Override
        public void insertTrade(PaperTrade trade) {
            trades.add(trade);
        }

        @Override
        public List<PaperTrade> findTrades(String modelCode) {
            return trades.stream()
                    .filter(item -> modelCode == null || item.modelCode().equals(modelCode))
                    .toList();
        }
    }
}
