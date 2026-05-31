package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantCandidateDto(
        String assetCode,
        String assetName,
        String signalDate,
        String candidateType,
        String decision,
        String reason,
        BigDecimal signalPrice,
        BigDecimal expectedReturnPct
) {
}
