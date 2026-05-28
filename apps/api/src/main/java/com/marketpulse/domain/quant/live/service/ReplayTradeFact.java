package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReplayTradeFact(
        LocalDate entryDate,
        LocalDate exitDate,
        String assetCode,
        String assetName,
        BigDecimal entryPrice,
        BigDecimal exitPrice,
        BigDecimal returnPct,
        BigDecimal score,
        String source
) {
}
