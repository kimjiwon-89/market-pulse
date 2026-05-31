package com.marketpulse.domain.quant.live.service;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MarketRegimeFeatureRow {
    private LocalDate cacheDate;
    private BigDecimal kospiMa20;
    private BigDecimal kospiMa60;
    private BigDecimal kospiMa20Slope5d;
    private BigDecimal kospiVol20;
    private BigDecimal kosdaqMa20;
    private BigDecimal kosdaqMa60;
    private BigDecimal kosdaqMa20Slope5d;
    private BigDecimal kosdaqVol20;
    private BigDecimal breadthMa20;
    private BigDecimal breadthMa60;
    private BigDecimal advanceRatio5d;
    private BigDecimal liquidityTrend;

    public MarketRegimeFeatures toFeatures() {
        return new MarketRegimeFeatures(
                cacheDate,
                kospiMa20,
                kospiMa60,
                kospiMa20Slope5d,
                kospiVol20,
                kosdaqMa20,
                kosdaqMa60,
                kosdaqMa20Slope5d,
                kosdaqVol20,
                breadthMa20,
                breadthMa60,
                advanceRatio5d,
                liquidityTrend
        );
    }
}
