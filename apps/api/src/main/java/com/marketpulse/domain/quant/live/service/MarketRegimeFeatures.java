package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MarketRegimeFeatures(
        LocalDate cacheDate,
        BigDecimal kospiMa20,
        BigDecimal kospiMa60,
        BigDecimal kospiMa20Slope5d,
        BigDecimal kospiVol20,
        BigDecimal kosdaqMa20,
        BigDecimal kosdaqMa60,
        BigDecimal kosdaqMa20Slope5d,
        BigDecimal kosdaqVol20,
        BigDecimal breadthMa20,
        BigDecimal breadthMa60,
        BigDecimal advanceRatio5d,
        BigDecimal liquidityTrend
) {
}
