package com.marketpulse.domain.quant.dto;

import java.util.List;

public record BacktestResponseDto(
        Long strategyId,
        String strategyName,
        String from,
        String to,
        Long initialCash,
        PerformanceSummaryDto performance,
        List<EquityPointDto> equityCurve,
        List<AllocationDto> currentAllocation
) {}
