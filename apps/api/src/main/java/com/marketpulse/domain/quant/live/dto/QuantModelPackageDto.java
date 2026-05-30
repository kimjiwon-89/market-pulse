package com.marketpulse.domain.quant.live.dto;

import java.time.LocalDateTime;

public record QuantModelPackageDto(
        String modelCode,
        String modelName,
        String modelVersion,
        String category,
        String description,
        String packagePath,
        String packageStatus,
        boolean publicVisible,
        boolean runtimeReady,
        String adminNote,
        LocalDateTime discoveredAt,
        LocalDateTime updatedAt
) {
}
