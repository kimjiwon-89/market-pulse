package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record QuantPortfolioTargetDto(
        String modelCode,
        String date,
        String signalDate,
        String rebalanceDate,
        BigDecimal cashWeight,
        List<QuantPortfolioPositionDto> positions,
        List<QuantPortfolioPositionDto> holdings,
        Map<String, BigDecimal> sectorWeights,
        Map<String, BigDecimal> marketWeights
) {}
