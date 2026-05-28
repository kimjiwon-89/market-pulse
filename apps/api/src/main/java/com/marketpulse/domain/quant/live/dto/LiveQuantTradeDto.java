package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;

public record LiveQuantTradeDto(
        Long tradeId,
        String assetCode,
        String assetName,
        String side,
        String fillTime,
        BigDecimal signalPrice,
        BigDecimal observedPrice,
        BigDecimal fillPrice,
        String fillSource,
        BigDecimal slippageAssumptionPct,
        BigDecimal realizedReturnPct,
        String modelReason
) {
}
