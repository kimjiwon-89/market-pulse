package com.marketpulse.domain.quant.live.dto;

import java.util.List;

public record LiveQuantReportDetailDto(
        Long reportId,
        String reportDate,
        String period,
        String modelCode,
        String title,
        String generatedBy,
        String summaryText,
        List<ReportSectionDto> sections,
        List<CheckpointAnalysisDto> checkpointAnalyses,
        List<LearningFeedbackDto> learningFeedback
) {
}
