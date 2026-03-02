package com.marketpulse.domain.stock.controller;

import com.marketpulse.domain.stock.dto.ForeignTradeRequest;
import com.marketpulse.domain.stock.service.StockService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.*;


@Tag(name = "외국인 Stock API", description = "외국인 매매")
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @Operation(summary = "외국인 매매 추정 조회")
    @GetMapping("/foreign-trade")
    public ApiResponse<String> foreignTrade(
            @ParameterObject @ModelAttribute ForeignTradeRequest request
    ) {

        String result = stockService.callForeignTrade(request);

        return ApiResponse.success(result);
    }
}
