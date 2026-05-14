package com.marketpulse.domain.stock.controller;

import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Stock API", description = "투자자별 순매수/순매도 종목 순위")
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final InvestorService investorService;

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
}
