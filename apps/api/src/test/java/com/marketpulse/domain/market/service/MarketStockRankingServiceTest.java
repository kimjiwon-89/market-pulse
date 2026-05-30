package com.marketpulse.domain.market.service;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketStockRankingServiceTest {

    private final MarketDailyPriceMapper mapper = mock(MarketDailyPriceMapper.class);
    private final MarketStockRankingService service = new MarketStockRankingService(mapper);

    @Test
    void getsTopTwentyRankingsByTradeAmountForRequestedFriday() {
        LocalDate friday = LocalDate.of(2026, 5, 29);
        when(mapper.findStockRankings(friday, "TRADE_AMOUNT", 20)).thenReturn(List.of(item()));

        List<MarketStockRankingDto> rankings = service.getRankings("20260529", "TRADE_AMOUNT", 20);

        verify(mapper).findStockRankings(friday, "TRADE_AMOUNT", 20);
        assertThat(rankings).hasSize(1);
        assertThat(rankings.get(0).getTradeDate()).isEqualTo(friday);
    }

    @Test
    void resolvesPreviousFridayFromSaturday() {
        assertThat(MarketStockRankingService.previousFriday(LocalDate.of(2026, 5, 30)))
                .isEqualTo(LocalDate.of(2026, 5, 29));
    }

    private MarketStockRankingDto item() {
        MarketStockRankingDto dto = new MarketStockRankingDto();
        dto.setRank(1);
        dto.setCode("005930");
        dto.setName("삼성전자");
        dto.setTradeDate(LocalDate.of(2026, 5, 29));
        return dto;
    }
}
