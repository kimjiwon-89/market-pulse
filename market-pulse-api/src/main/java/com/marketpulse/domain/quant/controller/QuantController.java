package com.marketpulse.domain.quant.controller;

import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.service.QuantBacktestService;
import com.marketpulse.domain.quant.service.QuantCollectService;
import com.marketpulse.domain.quant.service.QuantExperimentService;
import com.marketpulse.domain.quant.service.QuantModelDefinitionService;
import com.marketpulse.domain.quant.service.QuantModelFeatureService;
import com.marketpulse.domain.quant.service.QuantModelSignalService;
import com.marketpulse.domain.quant.service.QuantStrategyService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
    private final QuantModelDefinitionService modelDefinitionService;
    private final QuantModelFeatureService modelFeatureService;
    private final QuantModelSignalService modelSignalService;

    @Operation(summary = "전략 목록 조회")
    @GetMapping("/strategies")
    public ApiResponse<List<StrategyDto>> getStrategies() {
        return ApiResponse.success(strategyService.getAllStrategies());
    }

    @Operation(summary = "Quant 모델 목록")
    @GetMapping("/models")
    public ApiResponse<List<QuantModelDto>> getModels(
            @RequestParam(defaultValue = "false") boolean includeInactive,
            Authentication authentication) {
        if (includeInactive) {
            requireAdmin(authentication);
        }
        return ApiResponse.success(modelDefinitionService.list(includeInactive));
    }

    @Operation(summary = "Quant 모델 상세")
    @GetMapping("/models/{modelId}")
    public ApiResponse<QuantModelDto> getModel(@PathVariable Long modelId) {
        return ApiResponse.success(modelDefinitionService.get(modelId));
    }

    @Operation(summary = "Quant 모델 추가 (ADMIN 전용)")
    @PostMapping("/models")
    public ApiResponse<QuantModelDto> createModel(
            @Valid @RequestBody QuantModelCreateRequest request,
            Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(modelDefinitionService.create(request, username(authentication)));
    }

    @Operation(summary = "Quant 모델 수정 (ADMIN 전용)")
    @PatchMapping("/models/{modelId}")
    public ApiResponse<QuantModelDto> updateModel(
            @PathVariable Long modelId,
            @Valid @RequestBody QuantModelUpdateRequest request,
            Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(modelDefinitionService.update(modelId, request));
    }

    @Operation(summary = "Quant 모델 비활성화 (ADMIN 전용)")
    @DeleteMapping("/models/{modelId}")
    public ApiResponse<String> deactivateModel(
            @PathVariable Long modelId,
            Authentication authentication) {
        requireAdmin(authentication);
        modelDefinitionService.deactivate(modelId);
        return ApiResponse.success("model deactivated: " + modelId);
    }

    @Operation(summary = "Quant 모델 feature snapshot 생성 (ADMIN 전용)")
    @PostMapping("/models/{modelCode}/features")
    public ApiResponse<QuantFeatureGenerateResponse> generateModelFeatures(
            @PathVariable String modelCode,
            @RequestParam String from,
            @RequestParam String to,
            Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(modelFeatureService.generate(modelCode, from, to));
    }

    @Operation(summary = "Quant 모델 feature snapshot 조회")
    @GetMapping("/models/{modelCode}/features")
    public ApiResponse<List<QuantCoreFeatureSnapshotDto>> getModelFeatures(
            @PathVariable String modelCode,
            @RequestParam String date,
            @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.success(modelFeatureService.list(modelCode, date, limit));
    }

    @Operation(summary = "Quant 모델 signal 생성 (ADMIN 전용)")
    @PostMapping("/models/{modelCode}/signals")
    public ApiResponse<QuantSignalGenerateResponse> generateModelSignals(
            @PathVariable String modelCode,
            @RequestParam String date,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(modelSignalService.generate(modelCode, date, limit));
    }

    @Operation(summary = "Quant 모델 signal 조회")
    @GetMapping("/models/{modelCode}/signals")
    public ApiResponse<List<QuantCoreSignalDto>> getModelSignals(
            @PathVariable String modelCode,
            @RequestParam String date,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(modelSignalService.list(modelCode, date, limit));
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

    private String username(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }
}
