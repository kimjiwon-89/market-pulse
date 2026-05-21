package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record QuantPortfolioPositionDto(
        String assetCode,
        String assetName,
        String market,
        String sector,
        BigDecimal currentWeight,
        BigDecimal targetWeight,
        BigDecimal score,
        String nextAction
) {}
