package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MarketRegimeSnapshot(
        LocalDate tradeDate,
        LocalDate cacheDate,
        BigDecimal liveKospi,
        BigDecimal liveKosdaq,
        String kospiRegime,
        String kosdaqRegime,
        String kospiAllowedStrategy,
        String kosdaqAllowedStrategy,
        BigDecimal kospiRiskBudget,
        BigDecimal kosdaqRiskBudget,
        String combinedRegime,
        String allowedStrategy,
        BigDecimal confidence,
        BigDecimal riskBudget,
        int bullScore,
        int bearScore,
        int stressScore,
        BigDecimal breadthMa20,
        BigDecimal breadthMa60,
        BigDecimal volatility20,
        BigDecimal liquidityTrend,
        LocalDateTime updatedAt
) {
}
