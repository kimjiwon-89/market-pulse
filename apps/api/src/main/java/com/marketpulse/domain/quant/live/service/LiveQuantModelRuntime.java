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

import java.util.List;

public interface LiveQuantModelRuntime {
    String modelCode();

    boolean visible();

    LiveQuantModelSummaryDto summary();

    LiveQuantModelDetailDto detail();

    List<LiveQuantCandidateDto> candidates(String date);

    List<LiveQuantPositionDto> positions();

    List<LiveQuantTradeDto> trades();

    List<LiveQuantExitPlanDto> exitPlans();

    List<WatchedAssetDto> watchedAssets(String date);

    List<OutcomeCheckpointDto> outcomeCheckpoints(Long watchId);

    List<LearningFeedbackDto> learningFeedback();

    List<LiveQuantReportSummaryDto> reports(String period);

    LiveQuantReportDetailDto report(Long reportId);
}
