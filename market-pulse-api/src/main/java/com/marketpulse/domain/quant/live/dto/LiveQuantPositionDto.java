package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantPositionDto(
        String assetCode,
        String assetName,
        String entryTime,
        BigDecimal fillPrice,
        BigDecimal currentPrice,
        BigDecimal unrealizedReturnPct,
        BigDecimal expectedReturnPct,
        String exitRule
) {
}
