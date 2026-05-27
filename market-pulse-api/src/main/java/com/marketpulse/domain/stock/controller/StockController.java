package com.marketpulse.domain.stock.controller;

import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.domain.stock.dto.StockChartItemDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockDisclosureDto;
import com.marketpulse.domain.stock.dto.StockInvestorDto;
import com.marketpulse.domain.stock.dto.StockMinuteCandleDto;
import com.marketpulse.domain.stock.dto.StockOrderbookDto;
import com.marketpulse.domain.stock.dto.StockReportDto;
import com.marketpulse.domain.stock.dto.StockSearchResultDto;
import com.marketpulse.domain.stock.service.StockDetailService;
import com.marketpulse.domain.stock.service.StockMasterService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Stock API", description = "종목 검색 및 순매수/순매도 종목 순위")
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final InvestorService investorService;
    private final StockMasterService stockMasterService;
    private final StockDetailService stockDetailService;

    @Operation(summary = "투자자별 순매수/순매도 상위 종목 조회")
    @GetMapping("/foreign-trade")
    public ApiResponse<List<TradeTopResponseDto>> foreignTrade(
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String investorType,
            @RequestParam(required = false) String tradeType,
            @RequestParam(required = false) String date
    ) {
        return ApiResponse.success(
                investorService.getTradeTop(market, investorType, tradeType, date)
        );
    }

    @Operation(summary = "종목 검색 (stock_master 기반, 이름 부분 일치)")
    @GetMapping("/search")
    public ApiResponse<List<StockSearchResultDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(stockMasterService.search(q, limit));
    }

    @Operation(summary = "종목 현재가 시세 (KIS FHKST01010100)")
    @GetMapping("/detail")
    public ApiResponse<StockDetailDto> detail(@RequestParam String code) {
        return ApiResponse.success(stockDetailService.getDetail(code));
    }

    @Operation(summary = "종목 일자별 차트 데이터 (KIS FHKST01010400)")
    @GetMapping("/chart")
    public ApiResponse<List<StockChartItemDto>> chart(
            @RequestParam String code,
            @RequestParam(defaultValue = "3M") String period
    ) {
        return ApiResponse.success(stockDetailService.getChart(code, period));
    }

    @Operation(summary = "종목 투자자 동향 (KIS FHKST01010900)")
    @GetMapping("/investor")
    public ApiResponse<StockInvestorDto> investor(@RequestParam String code) {
        return ApiResponse.success(stockDetailService.getInvestor(code));
    }

    @Operation(summary = "종목 당일 1분봉 차트 데이터 (KIS FHKST03010200, 당일 최대 30건)")
    @GetMapping("/minute-chart")
    public ApiResponse<List<StockMinuteCandleDto>> minuteChart(
            @RequestParam String code,
            @RequestParam(defaultValue = "J") String market,
            @RequestParam(required = false) String time,
            @RequestParam(defaultValue = "true") boolean includePast
    ) {
        try {
            return ApiResponse.success(stockDetailService.getMinuteChart(code, market, time, includePast));
        } catch (IllegalArgumentException e) {
            return ApiResponse.failure(e.getMessage());
        }
    }

    @Operation(summary = "종목 호가/예상체결 조회 (KIS FHKST01010200, 읽기 전용)")
    @GetMapping("/orderbook")
    public ApiResponse<StockOrderbookDto> orderbook(
            @RequestParam String code,
            @RequestParam(defaultValue = "J") String market
    ) {
        try {
            return ApiResponse.success(stockDetailService.getOrderbook(code, market));
        } catch (IllegalArgumentException e) {
            return ApiResponse.failure(e.getMessage());
        }
    }

    @Operation(summary = "종목 공시 메타데이터 조회 (OpenDART 연동 준비)")
    @GetMapping("/disclosures")
    public ApiResponse<List<StockDisclosureDto>> disclosures(
            @RequestParam String code,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        try {
            return ApiResponse.success(stockDetailService.getDisclosures(code, from, to));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.failure(e.getMessage());
        }
    }

    @Operation(summary = "종목 리포트 메타데이터 조회 (본문 저장 제외)")
    @GetMapping("/reports")
    public ApiResponse<List<StockReportDto>> reports(@RequestParam String code) {
        try {
            return ApiResponse.success(stockDetailService.getReports(code));
        } catch (IllegalArgumentException e) {
            return ApiResponse.failure(e.getMessage());
        }
    }
}
