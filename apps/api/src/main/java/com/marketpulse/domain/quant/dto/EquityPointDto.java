package com.marketpulse.domain.quant.dto;

public record EquityPointDto(
        String date,
        Long value,
        double returnPct
) {}
