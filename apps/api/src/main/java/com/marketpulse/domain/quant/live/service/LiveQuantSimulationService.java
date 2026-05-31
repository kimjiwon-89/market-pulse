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

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LiveQuantSimulationService {
    private static final Set<String> HIDDEN_MODEL_CODES = Set.of("BULL_V4");

    private final LiveQuantRuntimeRegistry registry;
    private final QuantModelPackageService packageService;
    private final LiveQuantPaperTradingService paperTradingService;

    @Autowired
    public LiveQuantSimulationService(
            LiveQuantRuntimeRegistry registry,
            ObjectProvider<QuantModelPackageService> packageService,
            ObjectProvider<LiveQuantPaperTradingService> paperTradingService
    ) {
        this.registry = registry;
        this.packageService = packageService.getIfAvailable();
        this.paperTradingService = paperTradingService.getIfAvailable();
    }

    public LiveQuantSimulationService(LiveQuantRuntimeRegistry registry) {
        this.registry = registry;
        this.packageService = null;
        this.paperTradingService = null;
    }

    public List<LiveQuantModelSummaryDto> getVisibleModels() {
        List<LiveQuantModelSummaryDto> runtimeModels = registry.visibleSummaries().stream()
                .filter(summary -> !HIDDEN_MODEL_CODES.contains(summary.modelCode()))
                .toList();
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
        LiveQuantModelDetailDto base;
        try {
            base = registry.require(modelCode).detail();
        } catch (IllegalArgumentException e) {
            if (packageService != null) {
                base = packageService.publicVisibleDetail(modelCode);
            } else {
                throw e;
            }
        }
        return new LiveQuantModelDetailDto(
                base.summary(),
                getPositions(modelCode),
                getCandidates(modelCode, null),
                getTrades(modelCode),
                base.exitPlans(),
                base.watchedAssets(),
                base.learningFeedback()
        );
    }

    public List<LiveQuantCandidateDto> getCandidates(String modelCode, String date) {
        List<LiveQuantCandidateDto> paperCandidates = paperCandidates(modelCode, date);
        try {
            return java.util.stream.Stream.concat(
                    paperCandidates.stream(),
                    registry.require(modelCode).candidates(date).stream()
            ).toList();
        } catch (IllegalArgumentException e) {
            if (packageService != null) {
                return java.util.stream.Stream.concat(
                        paperCandidates.stream(),
                        packageService.publicVisibleCandidates(modelCode).stream()
                ).toList();
            }
            throw e;
        }
    }

    public List<LiveQuantPositionDto> getPositions(String modelCode) {
        List<LiveQuantPositionDto> paperPositions = paperTradingService == null
                ? List.of()
                : paperTradingService.positions(modelCode);
        try {
            return java.util.stream.Stream.concat(
                    paperPositions.stream(),
                    registry.require(modelCode).positions().stream()
            ).toList();
        } catch (IllegalArgumentException e) {
            if (packageService != null) {
                packageService.publicVisibleDetail(modelCode);
                return paperPositions;
            }
            throw e;
        }
    }

    public List<LiveQuantTradeDto> getTrades(String modelCode) {
        List<LiveQuantTradeDto> paperTrades = paperTradingService == null
                ? List.of()
                : paperTradingService.trades(modelCode);
        try {
            return java.util.stream.Stream.concat(
                    paperTrades.stream(),
                    registry.require(modelCode).trades().stream()
            ).toList();
        } catch (IllegalArgumentException e) {
            if (packageService != null) {
                return java.util.stream.Stream.concat(
                        paperTrades.stream(),
                        packageService.publicVisibleTrades(modelCode).stream()
                ).toList();
            }
            throw e;
        }
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
        try {
            return registry.require("BULL_V4").report(reportId);
        } catch (IllegalArgumentException e) {
            if (packageService != null) {
                return packageService.publicVisibleReport(reportId);
            }
            throw e;
        }
    }

    public List<LiveQuantReportSummaryDto> getReports(String period, String modelCode) {
        if (modelCode != null && !modelCode.isBlank()) {
            try {
                return registry.require(modelCode).reports(period);
            } catch (IllegalArgumentException e) {
                if (packageService != null) {
                    return packageService.publicVisibleReports(period, modelCode);
                }
                throw e;
            }
        }
        List<LiveQuantReportSummaryDto> runtimeReports = registry.visibleSummaries().stream()
                .filter(summary -> !HIDDEN_MODEL_CODES.contains(summary.modelCode()))
                .flatMap(summary -> registry.require(summary.modelCode()).reports(period).stream())
                .toList();
        if (packageService == null) {
            return runtimeReports;
        }
        return java.util.stream.Stream.concat(
                runtimeReports.stream(),
                packageService.publicVisibleReports(period, null).stream()
        ).toList();
    }

    public LiveQuantPaperTradingService.RunResult runPaperTradingOnce() {
        if (paperTradingService == null) {
            throw new IllegalStateException("Live quant paper trading service is not available");
        }
        return paperTradingService.runOnce();
    }

    private List<LiveQuantCandidateDto> paperCandidates(String modelCode, String date) {
        if (paperTradingService == null) {
            return List.of();
        }
        LocalDate signalDate = date == null || date.isBlank()
                ? LocalDate.now(java.time.ZoneId.of("Asia/Seoul"))
                : LocalDate.parse(date);
        return paperTradingService.candidates(modelCode, signalDate);
    }
}
