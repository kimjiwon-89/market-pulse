package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record QuantCostSummaryDto(
        BigDecimal grossReturn,
        BigDecimal netReturn,
        BigDecimal totalTurnover,
        BigDecimal avgTurnover,
        BigDecimal totalFee,
        BigDecimal totalTax,
        BigDecimal totalCost,
        int tradeCount
) {}
