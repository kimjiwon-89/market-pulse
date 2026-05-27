package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record QuantBacktestMetricDto(
        BigDecimal monthlyReturn,
        BigDecimal mdd,
        BigDecimal sharpe,
        BigDecimal winRate,
        BigDecimal totalCost
) {}
