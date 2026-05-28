package com.marketpulse.domain.quant.live.dto;

public record LearningFeedbackDto(
        String modelCode,
        String feedbackType,
        String evidence,
        String recommendation,
        String status
) {
}
