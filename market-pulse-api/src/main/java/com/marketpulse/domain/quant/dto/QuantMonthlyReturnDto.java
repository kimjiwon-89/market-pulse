package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record QuantMonthlyReturnDto(
        Integer year,
        Integer month,
        BigDecimal returnPct
) {}
