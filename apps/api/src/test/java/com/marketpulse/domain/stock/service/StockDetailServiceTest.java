package com.marketpulse.domain.stock.service;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockMinuteCandleDto;
import com.marketpulse.domain.stock.dto.StockOrderbookDto;
import com.marketpulse.domain.stock.vo.KisMinutePriceResponse;
import com.marketpulse.domain.stock.vo.KisMinutePriceVo;
import com.marketpulse.domain.stock.vo.KisOrderbookVo;
import com.marketpulse.domain.stock.vo.StockPriceVo;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockDetailServiceTest {

    private final ExternalApiClient externalApiClient = mock(ExternalApiClient.class);
    private final MarketDailyPriceMapper marketDailyPriceMapper = mock(MarketDailyPriceMapper.class);
    private final StockDetailService service = new StockDetailService(externalApiClient, marketDailyPriceMapper);

    @Test
    void getDetailBackfillsMissingKisNameFromLatestMarketDailyPrice() {
        KisResponse<StockPriceVo> response = new KisResponse<>();
        response.setRt_cd("0");
        StockPriceVo output = new StockPriceVo();
        output.setCurrentPrice("13250");
        output.setChangeRate("30.00");
        output.setVolume("1000000");
        response.setOutput(output);
        when(externalApiClient.callGet(
                eq("/uapi/domestic-stock/v1/quotations/inquire-price"),
                eq("FHKST01010100"),
                anyMap(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(response);
        MarketStockRankingDto fallback = new MarketStockRankingDto();
        fallback.setCode("001740");
        fallback.setName("SK네트웍스");
        fallback.setMarket("KOSPI");
        fallback.setSector("유통");
        fallback.setClosePrice(new BigDecimal("13250"));
        when(marketDailyPriceMapper.findLatestStockDetail("001740")).thenReturn(fallback);

        StockDetailDto detail = service.getDetail("001740");

        assertThat(detail.getName()).isEqualTo("SK네트웍스");
        assertThat(detail.getMarket()).isEqualTo("KOSPI");
        assertThat(detail.getSector()).isEqualTo("유통");
        assertThat(detail.getCurrentPrice()).isEqualTo(13250);
    }

    @Test
    void getMinuteChartReturnsAscendingNormalizedCandles() {
        KisMinutePriceResponse response = new KisMinutePriceResponse();
        response.setOutput2(List.of(
                minute("20260524", "153000", "293000", "294000", "292000", "292500", "35,400", "10372200000"),
                minute("20260524", "152900", "292500", "293000", "292000", "292100", "", "")
        ));
        when(externalApiClient.callGet(
                eq("/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"),
                eq("FHKST03010200"),
                anyMap(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(response);

        List<StockMinuteCandleDto> candles = service.getMinuteChart("005930", "J", "153000", true);

        assertThat(candles).extracting(StockMinuteCandleDto::getTime)
                .containsExactly("20260524152900", "20260524153000");
        assertThat(candles.get(0).getVolume()).isZero();
        assertThat(candles.get(0).getSource()).isEqualTo("KIS_REST");
        assertThat(candles.get(1).getVolume()).isEqualTo(35400);
    }

    @Test
    void getMinuteChartReturnsEmptyListWhenKisHasNoOutput2() {
        when(externalApiClient.callGet(
                eq("/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"),
                eq("FHKST03010200"),
                anyMap(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new KisMinutePriceResponse());

        assertThat(service.getMinuteChart("005930", "J", "153000", true)).isEmpty();
    }

    @Test
    void getMinuteChartRejectsInvalidCode() {
        assertThatThrownBy(() -> service.getMinuteChart("ABC", "J", "153000", true))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("종목코드는 6자리 숫자여야 합니다.");
    }

    @Test
    void getOrderbookOmitsMissingLevelsAndKeepsExpectedExecution() {
        KisResponse<KisOrderbookVo> response = new KisResponse<>();
        response.setRt_cd("0");
        KisOrderbookVo output = new KisOrderbookVo();
        output.setAskPrice1("294000");
        output.setAskVolume1("1200");
        output.setBidPrice1("293000");
        output.setBidVolume1("980");
        output.setExpectedPrice("293000");
        output.setExpectedVolume("1800");
        response.setOutput(output);
        when(externalApiClient.callGet(
                eq("/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn"),
                eq("FHKST01010200"),
                anyMap(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(response);

        StockOrderbookDto orderbook = service.getOrderbook("005930", "J");

        assertThat(orderbook.getAsks()).hasSize(1);
        assertThat(orderbook.getBids()).hasSize(1);
        assertThat(orderbook.getAsks().get(0).getLevel()).isEqualTo(1);
        assertThat(orderbook.getExpectedPrice()).isEqualTo(293000);
        assertThat(orderbook.getExpectedVolume()).isEqualTo(1800);
    }

    private KisMinutePriceVo minute(
            String date,
            String time,
            String close,
            String high,
            String low,
            String open,
            String volume,
            String amount
    ) {
        KisMinutePriceVo vo = new KisMinutePriceVo();
        vo.setDate(date);
        vo.setTime(time);
        vo.setClosePrice(close);
        vo.setHighPrice(high);
        vo.setLowPrice(low);
        vo.setOpenPrice(open);
        vo.setVolume(volume);
        vo.setTradeAmount(amount);
        return vo;
    }
}
