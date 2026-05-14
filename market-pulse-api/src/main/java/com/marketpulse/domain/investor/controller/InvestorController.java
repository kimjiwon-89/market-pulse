package com.marketpulse.domain.investor.controller;

import com.marketpulse.domain.investor.dto.MarketFlowDto;
import com.marketpulse.domain.investor.dto.MemoRequestDto;
import com.marketpulse.domain.investor.dto.MemoResponseDto;
import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investor")
@RequiredArgsConstructor
public class InvestorController {

    private final InvestorService investorService;

    /* ── Trade Top ── */

    @GetMapping("/trade-top")
    public ApiResponse<List<TradeTopResponseDto>> tradeTop(
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String investorType,
            @RequestParam(required = false) String tradeType,
            @RequestParam(required = false) String date
    ) {
        return ApiResponse.success(
                investorService.getTradeTop(market, investorType, tradeType, date)
        );
    }

    /* ── Market Flow ── */

    @GetMapping("/market-flow")
    public ApiResponse<List<MarketFlowDto>> marketFlow(
            @RequestParam(required = false, defaultValue = "KOSPI") String market
    ) {
        return ApiResponse.success(investorService.getMarketFlow(market));
    }

    /* ── Memo ── */

    @GetMapping("/memo")
    public ApiResponse<MemoResponseDto> getMemo(
            @RequestParam String date,
            @RequestParam String market
    ) {
        return ApiResponse.success(investorService.getMemo(date, market));
    }

    @PostMapping("/memo")
    public ApiResponse<MemoResponseDto> saveMemo(@RequestBody MemoRequestDto req) {
        return ApiResponse.success(investorService.saveMemo(req));
    }

    @DeleteMapping("/memo/{id}")
    public ApiResponse<Void> deleteMemo(@PathVariable Long id) {
        investorService.deleteMemo(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/memo/list")
    public ApiResponse<List<MemoResponseDto>> getMemoList(
            @RequestParam(required = false, defaultValue = "KOSPI") String market,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ApiResponse.success(investorService.getMemoList(market, page, size));
    }
}
