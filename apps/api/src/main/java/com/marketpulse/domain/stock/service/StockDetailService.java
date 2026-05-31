package com.marketpulse.domain.stock.service;

import com.marketpulse.domain.investor.dto.InvestorDailyItem;
import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.stock.dto.StockChartItemDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockDisclosureDto;
import com.marketpulse.domain.stock.dto.StockInvestorDto;
import com.marketpulse.domain.stock.dto.StockMinuteCandleDto;
import com.marketpulse.domain.stock.dto.StockOrderbookDto;
import com.marketpulse.domain.stock.dto.StockReportDto;
import com.marketpulse.domain.stock.vo.KisDailyPriceResponse;
import com.marketpulse.domain.stock.vo.KisMinutePriceResponse;
import com.marketpulse.domain.stock.vo.KisMinutePriceVo;
import com.marketpulse.domain.stock.vo.KisOrderbookVo;
import com.marketpulse.domain.stock.vo.StockDailyPriceVo;
import com.marketpulse.domain.stock.vo.StockPriceVo;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockDetailService {

    private final ExternalApiClient externalApiClient;
    private final MarketDailyPriceMapper marketDailyPriceMapper;

    @Value("${opendart.api.key:}")
    private String openDartApiKey;

    private static final String PATH_PRICE    = "/uapi/domestic-stock/v1/quotations/inquire-price";
    private static final String PATH_DAILY    = "/uapi/domestic-stock/v1/quotations/inquire-daily-price";
    private static final String PATH_INVESTOR = "/uapi/domestic-stock/v1/quotations/inquire-investor";
    private static final String PATH_MINUTE   = "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice";
    private static final String PATH_ORDERBOOK = "/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn";

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public StockDetailDto getDetail(String code) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("FID_COND_MRKT_DIV_CODE", "J");
            params.put("FID_INPUT_ISCD", code);

            KisResponse<StockPriceVo> response = externalApiClient.callGet(
                    PATH_PRICE,
                    "FHKST01010100",
                    params,
                    new ParameterizedTypeReference<KisResponse<StockPriceVo>>() {}
            );
            response.validate();

            StockPriceVo v = response.getOutput();
            if (v == null || v.getCurrentPrice() == null || v.getCurrentPrice().isBlank()) {
                log.warn("KIS detail empty for code={}", code);
                return null;
            }
            return StockDetailDto.builder()
                    .code(code)
                    .name(v.getStockName())
                    .currentPrice(parseLong(v.getCurrentPrice()))
                    .prdyVrss(parseLong(v.getPrdyVrss()))
                    .prdyVrssSign(v.getPrdyVrssSign())
                    .changeRate(parseDouble(v.getChangeRate()))
                    .volume(parseLong(v.getVolume()))
                    .tradingValue(parseLong(v.getTradingValue()))
                    .marketCap(parseLong(v.getMarketCap()))
                    .openPrice(parseLong(v.getOpenPrice()))
                    .highPrice(parseLong(v.getHighPrice()))
                    .lowPrice(parseLong(v.getLowPrice()))
                    .per(parseDouble(v.getPer()))
                    .pbr(parseDouble(v.getPbr()))
                    .weekHigh(parseLong(v.getWeekHigh()))
                    .weekLow(parseLong(v.getWeekLow()))
                    .build();
        } catch (Exception e) {
            log.error("KIS detail API failed for code={}: {}", code, e.getMessage());
            return getMarketDailyDetail(code);
        }
    }

    private StockDetailDto getMarketDailyDetail(String code) {
        MarketStockRankingDto v = marketDailyPriceMapper.findLatestStockDetail(code);
        if (v == null) {
            return null;
        }
        long currentPrice = toLong(v.getClosePrice());
        long tradeAmount = toLong(v.getTradeAmount());
        return StockDetailDto.builder()
                .code(v.getCode())
                .name(v.getName())
                .market(v.getMarket())
                .sector(v.getSector())
                .currentPrice(currentPrice)
                .prdyVrss(0)
                .prdyVrssSign("")
                .changeRate(toDouble(v.getChangeRate()))
                .volume(v.getVolume() != null ? v.getVolume() : 0L)
                .tradingValue(tradeAmount)
                .marketCap(v.getMarketCap() != null ? v.getMarketCap() : 0L)
                .openPrice(toLong(v.getOpenPrice()))
                .highPrice(toLong(v.getHighPrice()))
                .lowPrice(toLong(v.getLowPrice()))
                .per(0)
                .pbr(0)
                .weekHigh(0)
                .weekLow(0)
                .build();
    }

    public List<StockChartItemDto> getChart(String code, String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = switch (period != null ? period : "3M") {
            case "1M" -> endDate.minusMonths(1);
            case "1Y" -> endDate.minusYears(1);
            default   -> endDate.minusMonths(3);
        };

        Map<String, String> params = new HashMap<>();
        params.put("FID_COND_MRKT_DIV_CODE", "J");
        params.put("FID_INPUT_ISCD", code);
        params.put("FID_INPUT_DATE_1", startDate.format(FMT));
        params.put("FID_INPUT_DATE_2", endDate.format(FMT));
        params.put("FID_PERIOD_DIV_CODE", "D");
        params.put("FID_ORG_ADJ_PRC", "0");

        try {
            KisDailyPriceResponse response = externalApiClient.callGet(
                    PATH_DAILY,
                    "FHKST01010400",
                    params,
                    new ParameterizedTypeReference<KisDailyPriceResponse>() {}
            );

            List<StockDailyPriceVo> items = response.getOutput2();
            if (items == null || items.isEmpty()) {
                log.warn("KIS chart empty for code={}", code);
                return getMarketDailyChart(code, startDate, endDate);
            }

            return items.stream()
                    .map(v -> StockChartItemDto.builder()
                            .date(v.getDate())
                            .close(parseLong(v.getClosePrice()))
                            .open(parseLong(v.getOpenPrice()))
                            .high(parseLong(v.getHighPrice()))
                            .low(parseLong(v.getLowPrice()))
                            .volume(parseLong(v.getVolume()))
                            .changeRate(parseDouble(v.getChangeRate()))
                            .build())
                    .sorted(Comparator.comparing(StockChartItemDto::getDate))
                    .toList();
        } catch (Exception e) {
            log.error("KIS chart API failed for code={}: {}", code, e.getMessage());
            return getMarketDailyChart(code, startDate, endDate);
        }
    }

    private List<StockChartItemDto> getMarketDailyChart(String code, LocalDate startDate, LocalDate endDate) {
        List<com.marketpulse.domain.quant.vo.MarketDailyPriceVo> rows =
                marketDailyPriceMapper.findByCodeAndDateRange(code, "STOCK", startDate, endDate);
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        final BigDecimal[] previousClose = {null};
        return rows.stream()
                .sorted(Comparator.comparing(com.marketpulse.domain.quant.vo.MarketDailyPriceVo::getTradeDate))
                .map(row -> {
                    BigDecimal close = row.getClosePrice();
                    double changeRate = 0.0;
                    if (previousClose[0] != null && previousClose[0].compareTo(BigDecimal.ZERO) != 0 && close != null) {
                        changeRate = close.subtract(previousClose[0])
                                .divide(previousClose[0], 6, java.math.RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .doubleValue();
                    }
                    previousClose[0] = close;
                    return StockChartItemDto.builder()
                            .date(row.getTradeDate() != null ? row.getTradeDate().format(FMT) : "")
                            .close(toLong(row.getClosePrice()))
                            .open(toLong(row.getOpenPrice()))
                            .high(toLong(row.getHighPrice()))
                            .low(toLong(row.getLowPrice()))
                            .volume(row.getVolume() != null ? row.getVolume() : 0L)
                            .changeRate(changeRate)
                            .build();
                })
                .toList();
    }

    public StockInvestorDto getInvestor(String code) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("FID_COND_MRKT_DIV_CODE", "J");
            params.put("FID_INPUT_ISCD", code);

            KisResponse<List<InvestorDailyItem>> response = externalApiClient.callGet(
                    PATH_INVESTOR,
                    "FHKST01010900",
                    params,
                    new ParameterizedTypeReference<KisResponse<List<InvestorDailyItem>>>() {}
            );
            response.validate();

            List<InvestorDailyItem> items = response.getOutput();
            if (items == null || items.isEmpty()) {
                log.warn("KIS investor empty for code={}", code);
                return StockInvestorDto.builder().build();
            }

            InvestorDailyItem latest = items.get(0);
            return StockInvestorDto.builder()
                    .foreignBuy(parseLong(latest.getForeignBuyAmount()))
                    .foreignSell(parseLong(latest.getForeignSellAmount()))
                    .foreignNet(parseLong(latest.getForeignNetBuyAmount()))
                    .institutionBuy(parseLong(latest.getInstitutionBuyAmount()))
                    .institutionSell(parseLong(latest.getInstitutionSellAmount()))
                    .institutionNet(parseLong(latest.getInstitutionNetBuyAmount()))
                    .individualBuy(parseLong(latest.getPersonalBuyAmount()))
                    .individualSell(parseLong(latest.getPersonalSellAmount()))
                    .individualNet(parseLong(latest.getPersonalNetBuyAmount()))
                    .build();
        } catch (Exception e) {
            log.error("KIS investor API failed for code={}: {}", code, e.getMessage());
            return StockInvestorDto.builder().build();
        }
    }

    public List<StockMinuteCandleDto> getMinuteChart(String code, String market, String time, boolean includePast) {
        validateStockCode(code);

        Map<String, String> params = new HashMap<>();
        params.put("FID_COND_MRKT_DIV_CODE", normalizeMarket(market));
        params.put("FID_INPUT_ISCD", code);
        params.put("FID_INPUT_HOUR_1", normalizeTime(time));
        params.put("FID_PW_DATA_INCU_YN", includePast ? "Y" : "N");
        params.put("FID_ETC_CLS_CODE", "");

        try {
            KisMinutePriceResponse response = externalApiClient.callGet(
                    PATH_MINUTE,
                    "FHKST03010200",
                    params,
                    new ParameterizedTypeReference<KisMinutePriceResponse>() {}
            );

            List<KisMinutePriceVo> items = response != null ? response.getOutput2() : null;
            if (items == null || items.isEmpty()) {
                return List.of();
            }

            return items.stream()
                    .map(v -> StockMinuteCandleDto.builder()
                            .code(code)
                            .time(normalizeMinuteTime(v.getDate(), v.getTime()))
                            .open(parseLong(v.getOpenPrice()))
                            .high(parseLong(v.getHighPrice()))
                            .low(parseLong(v.getLowPrice()))
                            .close(parseLong(v.getClosePrice()))
                            .volume(parseLong(v.getVolume()))
                            .tradeAmount(parseLong(v.getTradeAmount()))
                            .source("KIS_REST")
                            .build())
                    .sorted(Comparator.comparing(StockMinuteCandleDto::getTime))
                    .toList();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("KIS minute chart API failed for code={}: {}", code, e.getMessage());
            return List.of();
        }
    }

    public StockOrderbookDto getOrderbook(String code, String market) {
        validateStockCode(code);

        Map<String, String> params = new HashMap<>();
        params.put("FID_COND_MRKT_DIV_CODE", normalizeMarket(market));
        params.put("FID_INPUT_ISCD", code);

        try {
            KisResponse<KisOrderbookVo> response = externalApiClient.callGet(
                    PATH_ORDERBOOK,
                    "FHKST01010200",
                    params,
                    new ParameterizedTypeReference<KisResponse<KisOrderbookVo>>() {}
            );
            response.validate();

            KisOrderbookVo v = response.getOutput();
            if (v == null) {
                return emptyOrderbook(code);
            }

            return StockOrderbookDto.builder()
                    .code(code)
                    .timestamp(LocalDateTime.now().format(TS_FMT))
                    .asks(buildLevels(askPrices(v), askVolumes(v)))
                    .bids(buildLevels(bidPrices(v), bidVolumes(v)))
                    .expectedPrice(parseLong(v.getExpectedPrice()))
                    .expectedVolume(parseLong(v.getExpectedVolume()))
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("KIS orderbook API failed for code={}: {}", code, e.getMessage());
            return emptyOrderbook(code);
        }
    }

    public List<StockDisclosureDto> getDisclosures(String code, String from, String to) {
        validateStockCode(code);
        if (openDartApiKey == null || openDartApiKey.isBlank()) {
            throw new IllegalStateException("OpenDART API 키가 설정되지 않았습니다.");
        }
        return List.of();
    }

    public List<StockReportDto> getReports(String code) {
        validateStockCode(code);
        return List.of();
    }

    private long parseLong(String s) {
        if (s == null || s.isBlank()) return 0L;
        try { return Long.parseLong(s.trim().replace(",", "")); }
        catch (NumberFormatException e) { return 0L; }
    }

    private double parseDouble(String s) {
        if (s == null || s.isBlank()) return 0.0;
        try { return Double.parseDouble(s.trim().replace(",", "")); }
        catch (NumberFormatException e) { return 0.0; }
    }

    private long toLong(BigDecimal value) {
        return value != null ? value.longValue() : 0L;
    }

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }

    private void validateStockCode(String code) {
        if (code == null || !code.matches("\\d{6}")) {
            throw new IllegalArgumentException("종목코드는 6자리 숫자여야 합니다.");
        }
    }

    private String normalizeMarket(String market) {
        if (market == null || market.isBlank()) return "J";
        if (List.of("J", "NX", "UN").contains(market)) return market;
        return "J";
    }

    private String normalizeTime(String time) {
        if (time == null || time.isBlank()) {
            return LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
        }
        return time;
    }

    private String normalizeMinuteTime(String date, String time) {
        return (date != null ? date : "") + (time != null ? time : "");
    }

    private StockOrderbookDto emptyOrderbook(String code) {
        return StockOrderbookDto.builder()
                .code(code)
                .timestamp(LocalDateTime.now().format(TS_FMT))
                .asks(List.of())
                .bids(List.of())
                .expectedPrice(0)
                .expectedVolume(0)
                .build();
    }

    private List<StockOrderbookDto.OrderbookLevel> buildLevels(String[] prices, String[] volumes) {
        List<StockOrderbookDto.OrderbookLevel> levels = new ArrayList<>();
        for (int i = 0; i < prices.length; i++) {
            long price = parseLong(prices[i]);
            long volume = parseLong(volumes[i]);
            if (price <= 0 && volume <= 0) continue;
            levels.add(StockOrderbookDto.OrderbookLevel.builder()
                    .level(i + 1)
                    .price(price)
                    .volume(volume)
                    .build());
        }
        return levels;
    }

    private String[] askPrices(KisOrderbookVo v) {
        return new String[] { v.getAskPrice1(), v.getAskPrice2(), v.getAskPrice3(), v.getAskPrice4(), v.getAskPrice5(),
                v.getAskPrice6(), v.getAskPrice7(), v.getAskPrice8(), v.getAskPrice9(), v.getAskPrice10() };
    }

    private String[] askVolumes(KisOrderbookVo v) {
        return new String[] { v.getAskVolume1(), v.getAskVolume2(), v.getAskVolume3(), v.getAskVolume4(), v.getAskVolume5(),
                v.getAskVolume6(), v.getAskVolume7(), v.getAskVolume8(), v.getAskVolume9(), v.getAskVolume10() };
    }

    private String[] bidPrices(KisOrderbookVo v) {
        return new String[] { v.getBidPrice1(), v.getBidPrice2(), v.getBidPrice3(), v.getBidPrice4(), v.getBidPrice5(),
                v.getBidPrice6(), v.getBidPrice7(), v.getBidPrice8(), v.getBidPrice9(), v.getBidPrice10() };
    }

    private String[] bidVolumes(KisOrderbookVo v) {
        return new String[] { v.getBidVolume1(), v.getBidVolume2(), v.getBidVolume3(), v.getBidVolume4(), v.getBidVolume5(),
                v.getBidVolume6(), v.getBidVolume7(), v.getBidVolume8(), v.getBidVolume9(), v.getBidVolume10() };
    }
}
