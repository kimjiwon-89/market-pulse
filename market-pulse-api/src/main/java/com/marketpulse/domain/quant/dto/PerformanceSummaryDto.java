package com.marketpulse.domain.quant.dto;

public record PerformanceSummaryDto(
        double totalReturn,
        double annualizedReturn,
        double monthlyReturn,
        double targetMonthlyReturn,
        long finalValue,
        long profitAmount,
        double initialToNowReturn,
        double mdd,
        double sharpeRatio,
        int totalTrades,
        double winRate
) {}
