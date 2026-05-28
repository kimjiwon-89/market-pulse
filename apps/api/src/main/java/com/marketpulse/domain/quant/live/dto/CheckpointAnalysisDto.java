package com.marketpulse.domain.quant.live.dto;

public record CheckpointAnalysisDto(
        String modelCode,
        String assetCode,
        String assetName,
        String trackingSource,
        String horizon,
        String analysisText
) {
}
