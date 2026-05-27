package com.marketpulse.domain.quant.live.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BullV4ReplayCacheStatusDto(
        String modelCode,
        String modelVersion,
        String configKey,
        long cachedRows,
        LocalDate firstExitDate,
        LocalDate latestExitDate,
        LocalDateTime latestUpdatedAt,
        boolean ready
) {
}
