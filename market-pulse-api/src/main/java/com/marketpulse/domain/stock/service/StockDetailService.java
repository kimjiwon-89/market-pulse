package com.marketpulse.domain.stock.service;

import com.marketpulse.domain.investor.dto.InvestorDailyItem;
import com.marketpulse.domain.stock.dto.StockChartItemDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockInvestorDto;
import com.marketpulse.domain.stock.vo.KisDailyPriceResponse;
import com.marketpulse.domain.stock.vo.StockDailyPriceVo;
import com.marketpulse.domain.stock.vo.StockPriceVo;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockDetailService {

    private final ExternalApiClient externalApiClient;

    private static final String PATH_PRICE    = "/uapi/domestic-stock/v1/quotations/inquire-price";
    private static final String PATH_DAILY    = "/uapi/domestic-stock/v1/quotations/inquire-daily-price";
    private static final String PATH_INVESTOR = "/uapi/domestic-stock/v1/quotations/inquire-investor";

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

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
            return null;
        }
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
                return List.of();
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
                    .toList();
        } catch (Exception e) {
            log.error("KIS chart API failed for code={}: {}", code, e.getMessage());
            return List.of();
        }
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
}
