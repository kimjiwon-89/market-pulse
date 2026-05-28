package com.marketpulse.domain.quant.dto;

import java.util.Map;

public record ExperimentVariantDto(
        Long id,
        Long runId,
        String variantCode,
        Map<String, Object> params,
        double totalReturn,
        double annualizedReturn,
        double monthlyReturn,
        double mdd,
        double sharpeRatio,
        double turnover,
        long totalCost,
        boolean targetAchieved,
        String biasCheckStatus,
        double overfitScore,
        boolean promoted
) {
}
