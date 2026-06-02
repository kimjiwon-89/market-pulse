package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;

public record RealtimeStockSnapshot(
        String assetCode,
        String assetName,
        String market,
        BigDecimal currentPrice,
        BigDecimal changeRate,
        long tradingValue
) {
}
