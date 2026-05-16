package com.marketpulse.domain.stock.controller;

import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.domain.stock.dto.StockChartItemDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockInvestorDto;
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
}
