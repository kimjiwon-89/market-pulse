package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record OutcomeCheckpointDto(
        String horizon,
        String checkpointDate,
        BigDecimal decisionPrice,
        BigDecimal horizonClosePrice,
        BigDecimal forwardReturnPct,
        BigDecimal missedUpsidePct,
        BigDecimal avoidedDownsidePct,
        String quality,
        String analysisText
) {
}
