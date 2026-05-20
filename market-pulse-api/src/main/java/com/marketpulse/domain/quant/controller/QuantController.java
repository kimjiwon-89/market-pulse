package com.marketpulse.domain.quant.controller;

import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.service.QuantBacktestService;
import com.marketpulse.domain.quant.service.QuantCollectService;
import com.marketpulse.domain.quant.service.QuantExperimentService;
import com.marketpulse.domain.quant.service.QuantStrategyService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@Tag(name = "Quant", description = "Quant backtest and experiments")
@RestController
@RequestMapping("/api/quant")
@RequiredArgsConstructor
public class QuantController {
    private final QuantStrategyService strategyService;
    private final QuantBacktestService backtestService;
    private final QuantCollectService collectService;
    private final QuantExperimentService experimentService;

    @Operation(summary = "전략 목록 조회")
    @GetMapping("/strategies")
    public ApiResponse<List<StrategyDto>> getStrategies() {
        return ApiResponse.success(strategyService.getAllStrategies());
    }

    @Operation(summary = "백테스트 실행/결과 조회")
    @GetMapping("/backtest")
    public ApiResponse<BacktestResponseDto> backtest(
            @RequestParam Long strategyId,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "100000000") Long initialCash) {
        return ApiResponse.success(backtestService.backtest(new BacktestRequestDto(strategyId, from, to, initialCash)));
    }

    @Operation(summary = "전략 비교")
    @GetMapping("/performance")
    public ApiResponse<PerformanceResponseDto> performance(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String strategyIds) {
        List<Long> ids = strategyIds == null || strategyIds.isBlank()
                ? List.of()
                : Arrays.stream(strategyIds.split(",")).map(String::trim).filter(s -> !s.isBlank()).map(Long::valueOf).toList();
        return ApiResponse.success(backtestService.compareAll(from, to, ids));
    }

    @Operation(summary = "매매 이력 조회")
    @GetMapping("/trades")
    public ApiResponse<TradeLogPageDto> trades(
            @RequestParam Long strategyId,
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String tradeType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(backtestService.getTradeLogs(strategyId, from, to, tradeType, page, size));
    }

    @Operation(summary = "히스토리 데이터 수집 (ADMIN 전용)")
    @PostMapping("/collect")
    public ApiResponse<CollectStatusDto> collect(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "ALL") String dataType) {
        return ApiResponse.success(collectService.collect(from, to, dataType));
    }

    @Operation(summary = "수집 상태 확인")
    @GetMapping("/collect/status")
    public ApiResponse<CollectStatusDto> collectStatus() {
        return ApiResponse.success(collectService.getStatus());
    }

    @Operation(summary = "백테스트 캐시 삭제 (ADMIN 전용)")
    @DeleteMapping("/cache")
    public ApiResponse<String> clearCache(
            @RequestParam String from,
            @RequestParam String to) {
        backtestService.clearCache(from, to);
        return ApiResponse.success("cache cleared: " + from + "~" + to);
    }

    @Operation(summary = "Quant experiment run 목록")
    @GetMapping("/experiments")
    public ApiResponse<ExperimentRunListDto> experiments(
            @RequestParam(required = false) String strategyNameEn,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(experimentService.list(strategyNameEn, from, to, status));
    }

    @Operation(summary = "Quant experiment 실행 (ADMIN 전용)")
    @PostMapping("/experiments")
    public ApiResponse<ExperimentRunDto> startExperiment(
            @RequestBody ExperimentRunRequestDto request,
            Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(experimentService.start(request));
    }

    @Operation(summary = "Quant experiment 상세")
    @GetMapping("/experiments/{runId}")
    public ApiResponse<ExperimentRunDto> experiment(@PathVariable Long runId) {
        return ApiResponse.success(experimentService.get(runId));
    }

    @Operation(summary = "Quant experiment 매매 로그")
    @GetMapping("/experiments/{runId}/trades")
    public ApiResponse<TradeLogPageDto> experimentTrades(
            @PathVariable Long runId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(experimentService.getTrades(runId, variantId, page, size));
    }

    @Operation(summary = "Quant experiment variant 승격 기록")
    @PostMapping("/experiments/{runId}/promote")
    public ApiResponse<ExperimentVariantDto> promoteExperiment(
            @PathVariable Long runId,
            @RequestParam Long variantId,
            Authentication authentication) {
        requireAdmin(authentication);
        ExperimentVariantDto promoted = experimentService.promote(runId, variantId);
        if (promoted == null) {
            return ApiResponse.failure("overfitScore가 0.15를 초과해 승격할 수 없습니다.");
        }
        return ApiResponse.success(promoted);
    }

    private void requireAdmin(Authentication authentication) {
        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN 권한이 필요합니다.");
        }
    }
}
