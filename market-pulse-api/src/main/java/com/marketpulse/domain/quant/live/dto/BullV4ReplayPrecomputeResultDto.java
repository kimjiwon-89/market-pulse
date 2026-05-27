package com.marketpulse.domain.quant.live.dto;

import java.time.LocalDate;

public record BullV4ReplayPrecomputeResultDto(
        String modelCode,
        String modelVersion,
        String configKey,
        LocalDate fromDate,
        LocalDate toDate,
        int deletedCount,
        int insertedCount
) {
}
