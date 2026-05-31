package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingRepository;
import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingService;
import com.marketpulse.domain.quant.live.service.RealtimeQuoteProvider;
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
import static org.mockito.Mockito.when;

class LiveQuantPaperTradingServiceTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-31T01:00:00Z"), ZoneId.of("Asia/Seoul"));

    @Test
    void runOnceBuysTopCandidateWhenNoOpenPositionExists() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 29));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("CHANGE_RATE_DESC"), anyInt()))
                .thenReturn(List.of(ranking("005930", "삼성전자", "KOSPI", "10000", "4.20")));

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
    void runOnceSellsOpenPositionWhenStopLossIsHit() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        when(priceMapper.findLatestStockTradeDateOnOrBefore(any())).thenReturn(LocalDate.of(2026, 5, 29));
        when(priceMapper.findStockRankings(eq(LocalDate.of(2026, 5, 29)), eq("CHANGE_RATE_DESC"), anyInt()))
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
