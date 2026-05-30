package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.LearningFeedbackDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantCandidateDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantExitPlanDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantPositionDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantTradeDto;
import com.marketpulse.domain.quant.live.dto.OutcomeCheckpointDto;
import com.marketpulse.domain.quant.live.dto.WatchedAssetDto;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LiveQuantSimulationService {
    private final LiveQuantRuntimeRegistry registry;
    private final QuantModelPackageService packageService;

    @Autowired
    public LiveQuantSimulationService(LiveQuantRuntimeRegistry registry, ObjectProvider<QuantModelPackageService> packageService) {
        this.registry = registry;
        this.packageService = packageService.getIfAvailable();
    }

    public LiveQuantSimulationService(LiveQuantRuntimeRegistry registry) {
        this.registry = registry;
        this.packageService = null;
    }

    public List<LiveQuantModelSummaryDto> getVisibleModels() {
        List<LiveQuantModelSummaryDto> runtimeModels = registry.visibleSummaries();
        if (packageService == null) {
            return runtimeModels;
        }

        Set<String> runtimeCodes = new HashSet<>(runtimeModels.stream()
                .map(LiveQuantModelSummaryDto::modelCode)
                .toList());
        List<LiveQuantModelSummaryDto> packageModels = packageService.publicVisibleSummaries().stream()
                .filter(summary -> !runtimeCodes.contains(summary.modelCode()))
                .toList();
        return java.util.stream.Stream.concat(runtimeModels.stream(), packageModels.stream()).toList();
    }

    public LiveQuantModelDetailDto getModelDetail(String modelCode) {
        return registry.require(modelCode).detail();
    }

    public List<LiveQuantCandidateDto> getCandidates(String modelCode, String date) {
        return registry.require(modelCode).candidates(date);
    }

    public List<LiveQuantPositionDto> getPositions(String modelCode) {
        return registry.require(modelCode).positions();
    }

    public List<LiveQuantTradeDto> getTrades(String modelCode) {
        return registry.require(modelCode).trades();
    }

    public List<LiveQuantExitPlanDto> getExitPlans(String modelCode) {
        return registry.require(modelCode).exitPlans();
    }

    public List<LearningFeedbackDto> getLearningFeedback(String modelCode) {
        return registry.require(modelCode).learningFeedback();
    }

    public List<WatchedAssetDto> getWatchedAssets(String modelCode, String date) {
        return registry.require(modelCode).watchedAssets(date);
    }

    public List<OutcomeCheckpointDto> getOutcomeCheckpoints(Long watchId) {
        return registry.require("BULL_V4").outcomeCheckpoints(watchId);
    }

    public LiveQuantReportDetailDto getReport(Long reportId) {
        return registry.require("BULL_V4").report(reportId);
    }

    public List<LiveQuantReportSummaryDto> getReports(String period, String modelCode) {
        if (modelCode != null && !modelCode.isBlank()) {
            return registry.require(modelCode).reports(period);
        }
        return registry.visibleSummaries().stream()
                .flatMap(summary -> registry.require(summary.modelCode()).reports(period).stream())
                .toList();
    }
}
