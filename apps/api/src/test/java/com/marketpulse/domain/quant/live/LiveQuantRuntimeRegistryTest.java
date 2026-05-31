package com.marketpulse.domain.quant.live;

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
import com.marketpulse.domain.quant.live.service.LiveQuantModelRuntime;
import com.marketpulse.domain.quant.live.service.LiveQuantRuntimeRegistry;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LiveQuantRuntimeRegistryTest {

    @Test
    void visibleSummariesExposeOnlyVisibleRuntimesInRegistrationOrder() {
        LiveQuantRuntimeRegistry registry = new LiveQuantRuntimeRegistry(List.of(
                runtime("BULL_V4", true),
                runtime("BEAR_V1", false),
                runtime("SIDEWAYS_V1", true)
        ));

        assertThat(registry.visibleSummaries()).extracting(LiveQuantModelSummaryDto::modelCode)
                .containsExactly("BULL_V4", "SIDEWAYS_V1");
    }

    @Test
    void requireRuntimeRejectsUnknownModelCode() {
        LiveQuantRuntimeRegistry registry = new LiveQuantRuntimeRegistry(List.of(runtime("BULL_V4", true)));

        assertThatThrownBy(() -> registry.require("UNKNOWN"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown live quant model: UNKNOWN");
    }

    private LiveQuantModelRuntime runtime(String modelCode, boolean visible) {
        LiveQuantModelSummaryDto summary = new LiveQuantModelSummaryDto(
                modelCode,
                "1.0.0",
                modelCode + "_CONFIG",
                modelCode + " model",
                "상승장",
                "ACTIVE",
                new BigDecimal("1000000000"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0,
                0,
                0,
                null
        );

        return new LiveQuantModelRuntime() {
            @Override
            public String modelCode() {
                return modelCode;
            }

            @Override
            public boolean visible() {
                return visible;
            }

            @Override
            public LiveQuantModelSummaryDto summary() {
                return summary;
            }

            @Override
            public LiveQuantModelDetailDto detail() {
                return new LiveQuantModelDetailDto(summary, List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
            }

            @Override
            public List<LiveQuantCandidateDto> candidates(String date) {
                return List.of();
            }

            @Override
            public List<LiveQuantPositionDto> positions() {
                return List.of();
            }

            @Override
            public List<LiveQuantTradeDto> trades() {
                return List.of();
            }

            @Override
            public List<LiveQuantExitPlanDto> exitPlans() {
                return List.of();
            }

            @Override
            public List<WatchedAssetDto> watchedAssets(String date) {
                return List.of();
            }

            @Override
            public List<OutcomeCheckpointDto> outcomeCheckpoints(Long watchId) {
                return List.of();
            }

            @Override
            public List<LearningFeedbackDto> learningFeedback() {
                return List.of();
            }

            @Override
            public List<LiveQuantReportSummaryDto> reports(String period) {
                return List.of();
            }

            @Override
            public LiveQuantReportDetailDto report(Long reportId) {
                throw new IllegalArgumentException("No report");
            }
        };
    }
}
