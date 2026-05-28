package com.marketpulse.domain.quant.dto;

import java.util.List;

public record PerformanceResponseDto(
        String from,
        String to,
        List<EquityPointDto> benchmark,
        List<EquityPointDto> kosdaqBenchmark,
        List<StrategyPerformanceDto> strategies
) {}
