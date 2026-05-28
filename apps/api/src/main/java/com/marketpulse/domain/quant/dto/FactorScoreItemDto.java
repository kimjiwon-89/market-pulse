package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record FactorScoreItemDto(
        String key,
        String label,
        BigDecimal value,
        String direction
) {}
