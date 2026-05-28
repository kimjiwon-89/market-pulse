package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantExitPlanDto(
        String assetCode,
        String assetName,
        String checkpointTime,
        String exitCondition,
        BigDecimal stopLossPct,
        BigDecimal trailingStopPct,
        BigDecimal expectedReturnPct
) {
}
