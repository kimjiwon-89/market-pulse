package com.marketpulse.domain.quant.dto;

import java.util.List;

public record StrategyPerformanceDto(
        Long strategyId,
        String strategyName,
        double totalReturn,
        double mdd,
        double sharpeRatio,
        List<EquityPointDto> equityCurve
) {}
