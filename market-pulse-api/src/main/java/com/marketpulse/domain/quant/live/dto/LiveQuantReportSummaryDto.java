package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantReportSummaryDto(
        Long reportId,
        String reportDate,
        String period,
        String modelCode,
        String title,
        BigDecimal totalReturnPct,
        int entryCount,
        int exitCount,
        int warningCount,
        String generatedAt
) {
}
