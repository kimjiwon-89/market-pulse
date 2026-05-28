package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record SignalHistoryItemDto(
        String signalDate,
        String candidateStatus,
        BigDecimal score,
        BigDecimal targetWeight,
        String nextAction
) {}
