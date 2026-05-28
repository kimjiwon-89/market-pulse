package com.marketpulse.domain.quant.live.dto;

import java.util.List;

public record LiveQuantModelDetailDto(
        LiveQuantModelSummaryDto summary,
        List<LiveQuantPositionDto> positions,
        List<LiveQuantCandidateDto> candidates,
        List<LiveQuantTradeDto> trades,
        List<LiveQuantExitPlanDto> exitPlans,
        List<WatchedAssetDto> watchedAssets,
        List<LearningFeedbackDto> learningFeedback
) {
}
