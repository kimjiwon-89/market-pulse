package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantModelSummaryDto(
        String modelCode,
        String modelName,
        String status,
        BigDecimal seedMoney,
        BigDecimal totalReturnPct,
        BigDecimal totalProfit,
        BigDecimal monthlyReturnPct,
        int openPositionCount,
        int rawCandidateCountToday,
        int actualEntryCountToday,
        String latestReportTime
) {
}
