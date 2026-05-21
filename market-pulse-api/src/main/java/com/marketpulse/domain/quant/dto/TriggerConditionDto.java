package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record TriggerConditionDto(
        String condition,
        BigDecimal currentValue,
        BigDecimal threshold,
        boolean passed
) {}
