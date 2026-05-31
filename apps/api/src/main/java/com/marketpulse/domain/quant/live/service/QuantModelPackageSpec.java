package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;

public record QuantModelPackageSpec(
        String modelCode,
        String modelName,
        String modelVersion,
        String category,
        String description,
        String packagePath,
        BigDecimal seedMoney,
        BigDecimal expectedMonthlyReturnPct
) {
}
