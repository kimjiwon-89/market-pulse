package com.marketpulse.domain.investor.controller;

import com.marketpulse.domain.investor.dto.MarketFlowDto;
import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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

    /* ── Snapshot 관련 ── */

    @GetMapping("/snapshot/dates")
    public ApiResponse<List<String>> snapshotDates(
            @RequestParam(required = false, defaultValue = "FOREIGN") String investorType,
            @RequestParam(required = false, defaultValue = "BUY") String tradeType,
            @RequestParam(required = false, defaultValue = "KOSPI") String market
    ) {
        return ApiResponse.success(investorService.getAvailableDates(investorType, tradeType, market));
    }

    @PostMapping("/snapshot")
    public ApiResponse<String> triggerSnapshot(
            @RequestParam(required = false) String date
    ) {
        LocalDate snapDate = date != null
                ? LocalDate.parse(date, java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                : LocalDate.now();
        investorService.saveSnapshots(snapDate);
        return ApiResponse.success("Snapshot saved for " + snapDate);
    }

    /* ── Market Flow ── */

    @GetMapping("/market-flow")
    public ApiResponse<List<MarketFlowDto>> marketFlow(
            @RequestParam(required = false, defaultValue = "KOSPI") String market
    ) {
        return ApiResponse.success(investorService.getMarketFlow(market));
    }

}
