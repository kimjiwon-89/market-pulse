package com.marketpulse.domain.market.controller;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.market.service.MarketStockRankingService;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {
    private final MarketStockRankingService rankingService;

    @GetMapping("/stocks/rankings")
    public ApiResponse<List<MarketStockRankingDto>> stockRankings(
            @RequestParam(required = false) String date,
            @RequestParam(required = false, defaultValue = "VOLUME") String sort,
            @RequestParam(required = false, defaultValue = "20") Integer limit
    ) {
        return ApiResponse.success(rankingService.getRankings(date, sort, limit));
    }
}
