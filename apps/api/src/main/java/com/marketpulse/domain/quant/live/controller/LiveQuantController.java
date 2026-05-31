package com.marketpulse.domain.quant.live.controller;

import com.marketpulse.domain.quant.live.dto.*;
import com.marketpulse.domain.quant.live.service.BullV4ReplayPrecomputeService;
import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingService;
import com.marketpulse.domain.quant.live.service.LiveQuantSimulationService;
import com.marketpulse.domain.quant.live.service.MarketRegimeMonitorService;
import com.marketpulse.domain.quant.live.service.MarketRegimeSnapshot;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/quant/live")
@RequiredArgsConstructor
public class LiveQuantController {
    private final LiveQuantSimulationService service;
    private final BullV4ReplayPrecomputeService precomputeService;
    private final MarketRegimeMonitorService marketRegimeMonitorService;

    @GetMapping("/models")
    public ApiResponse<List<LiveQuantModelSummaryDto>> getModels() {
        return ApiResponse.success(service.getVisibleModels());
    }

    @GetMapping("/models/{modelCode}")
    public ApiResponse<LiveQuantModelDetailDto> getModel(@PathVariable String modelCode) {
        return ApiResponse.success(service.getModelDetail(modelCode));
    }

    @GetMapping("/models/{modelCode}/summary")
    public ApiResponse<LiveQuantModelSummaryDto> getSummary(@PathVariable String modelCode) {
        return ApiResponse.success(service.getModelDetail(modelCode).summary());
    }

    @GetMapping("/models/{modelCode}/positions")
    public ApiResponse<List<LiveQuantPositionDto>> getPositions(@PathVariable String modelCode) {
        return ApiResponse.success(service.getPositions(modelCode));
    }

    @GetMapping("/models/{modelCode}/candidates")
    public ApiResponse<List<LiveQuantCandidateDto>> getCandidates(@PathVariable String modelCode, @RequestParam(required = false) String date) {
        return ApiResponse.success(service.getCandidates(modelCode, date));
    }

    @GetMapping("/models/{modelCode}/trades")
    public ApiResponse<List<LiveQuantTradeDto>> getTrades(@PathVariable String modelCode) {
        return ApiResponse.success(service.getTrades(modelCode));
    }

    @GetMapping("/models/{modelCode}/exit-plans")
    public ApiResponse<List<LiveQuantExitPlanDto>> getExitPlans(@PathVariable String modelCode) {
        return ApiResponse.success(service.getExitPlans(modelCode));
    }

    @GetMapping("/models/{modelCode}/learning-feedback")
    public ApiResponse<List<LearningFeedbackDto>> getLearningFeedback(@PathVariable String modelCode) {
        return ApiResponse.success(service.getLearningFeedback(modelCode));
    }

    @GetMapping("/models/{modelCode}/watched-assets")
    public ApiResponse<List<WatchedAssetDto>> getWatchedAssets(@PathVariable String modelCode, @RequestParam(required = false) String date) {
        return ApiResponse.success(service.getWatchedAssets(modelCode, date));
    }

    @GetMapping("/watched-assets/{watchId}/outcome-checkpoints")
    public ApiResponse<List<OutcomeCheckpointDto>> getOutcomeCheckpoints(@PathVariable Long watchId) {
        return ApiResponse.success(service.getOutcomeCheckpoints(watchId));
    }

    @GetMapping("/trades/{tradeId}/post-exit-outcomes")
    public ApiResponse<List<OutcomeCheckpointDto>> getPostExitOutcomes(@PathVariable Long tradeId) {
        return ApiResponse.success(service.getOutcomeCheckpoints(tradeId));
    }

    @GetMapping("/reports")
    public ApiResponse<List<LiveQuantReportSummaryDto>> getReports(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String modelCode) {
        return ApiResponse.success(service.getReports(period, modelCode));
    }

    @GetMapping("/reports/{reportId}")
    public ApiResponse<LiveQuantReportDetailDto> getReport(@PathVariable Long reportId) {
        return ApiResponse.success(service.getReport(reportId));
    }

    @PostMapping("/bull-v4/replay/precompute")
    public ApiResponse<BullV4ReplayPrecomputeResultDto> precomputeBullV4Replay(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        LocalDate targetToDate = toDate == null || toDate.isBlank() ? LocalDate.now() : LocalDate.parse(toDate);
        if (fromDate == null || fromDate.isBlank()) {
            return ApiResponse.success(precomputeService.precomputeDaily(targetToDate));
        }
        return ApiResponse.success(precomputeService.precompute(LocalDate.parse(fromDate), targetToDate));
    }

    @GetMapping("/bull-v4/replay/cache-status")
    public ApiResponse<BullV4ReplayCacheStatusDto> getBullV4ReplayCacheStatus() {
        return ApiResponse.success(precomputeService.cacheStatus());
    }

    @GetMapping("/market-regime/latest")
    public ApiResponse<MarketRegimeSnapshot> getLatestMarketRegime() {
        return ApiResponse.success(marketRegimeMonitorService.latest());
    }

    @PostMapping("/market-regime/refresh")
    public ApiResponse<MarketRegimeSnapshot> refreshMarketRegime() {
        return ApiResponse.success(marketRegimeMonitorService.refreshLatest());
    }

    @PostMapping("/paper-trading/run")
    public ApiResponse<LiveQuantPaperTradingService.RunResult> runPaperTradingOnce() {
        return ApiResponse.success(service.runPaperTradingOnce());
    }
}
