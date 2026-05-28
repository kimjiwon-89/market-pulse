package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuantBacktestEvidenceDto(
        Long runId,
        String modelCode,
        String from,
        String to,
        BigDecimal monthlyReturn,
        BigDecimal mdd,
        BigDecimal sharpe,
        BigDecimal winRate,
        BigDecimal totalCost,
        QuantBacktestMetricDto metrics,
        List<EquityPointDto> equityCurve,
        List<EquityPointDto> drawdownCurve,
        List<QuantMonthlyReturnDto> monthlyReturns,
        QuantCostSummaryDto costSummary
) {}
