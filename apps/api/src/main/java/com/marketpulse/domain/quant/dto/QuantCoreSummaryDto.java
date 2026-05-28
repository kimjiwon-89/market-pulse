package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;

public record QuantCoreSummaryDto(
        String modelCode,
        String modelName,
        String activeVersion,
        String algorithm,
        String trainFrom,
        String trainTo,
        String latestSignalDate,
        String dataFreshnessDate,
        BigDecimal targetMonthlyReturn,
        boolean targetIsGuarantee,
        QuantBacktestMetricDto latestBacktestSummary
) {}
