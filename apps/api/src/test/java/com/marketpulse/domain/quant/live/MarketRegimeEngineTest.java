package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.quant.live.service.MarketRegimeEngine;
import com.marketpulse.domain.quant.live.service.MarketRegimeFeatures;
import com.marketpulse.domain.quant.live.service.MarketRegimeSnapshot;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class MarketRegimeEngineTest {

    private final MarketRegimeEngine engine = new MarketRegimeEngine();

    @Test
    void classifiesBothIndexesBullWhenLivePricesAreAboveSlowFeatures() {
        MarketRegimeSnapshot snapshot = engine.classify(
                bullFeatures(),
                new BigDecimal("2700.25"),
                new BigDecimal("860.10"),
                LocalDate.of(2026, 5, 30)
        );

        assertThat(snapshot.kospiRegime()).isEqualTo("BULL");
        assertThat(snapshot.kosdaqRegime()).isEqualTo("BULL");
        assertThat(snapshot.kospiAllowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.kosdaqAllowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.combinedRegime()).isEqualTo("BULL");
        assertThat(snapshot.allowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.riskBudget()).isEqualByComparingTo("1.00");
    }

    @Test
    void combinedRegimeUsesMoreConservativeIndexLabel() {
        MarketRegimeSnapshot snapshot = engine.classify(
                bullFeatures(),
                new BigDecimal("2700.25"),
                new BigDecimal("690.00"),
                LocalDate.of(2026, 5, 30)
        );

        assertThat(snapshot.kospiRegime()).isEqualTo("BULL");
        assertThat(snapshot.kosdaqRegime()).isEqualTo("SIDEWAYS");
        assertThat(snapshot.kospiAllowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.kosdaqAllowedStrategy()).isEqualTo("W4_RESTRICT");
        assertThat(snapshot.kospiRiskBudget()).isEqualByComparingTo("1.00");
        assertThat(snapshot.kosdaqRiskBudget()).isEqualByComparingTo("0.50");
        assertThat(snapshot.combinedRegime()).isEqualTo("SIDEWAYS");
        assertThat(snapshot.allowedStrategy()).isEqualTo("W4_RESTRICT");
        assertThat(snapshot.riskBudget()).isEqualByComparingTo("0.50");
    }

    @Test
    void classifiesCrashBeforeBullOrBearScoreCanOverrideIt() {
        MarketRegimeFeatures features = new MarketRegimeFeatures(
                LocalDate.of(2026, 5, 29),
                new BigDecimal("2450"),
                new BigDecimal("2500"),
                new BigDecimal("-0.020"),
                new BigDecimal("0.045"),
                new BigDecimal("775"),
                new BigDecimal("810"),
                new BigDecimal("-0.025"),
                new BigDecimal("0.050"),
                new BigDecimal("0.12"),
                new BigDecimal("0.10"),
                new BigDecimal("0.18"),
                new BigDecimal("-0.20")
        );

        MarketRegimeSnapshot snapshot = engine.classify(
                features,
                new BigDecimal("2300"),
                new BigDecimal("700"),
                LocalDate.of(2026, 5, 30)
        );

        assertThat(snapshot.combinedRegime()).isEqualTo("CRASH");
        assertThat(snapshot.allowedStrategy()).isEqualTo("CASH");
        assertThat(snapshot.riskBudget()).isEqualByComparingTo("0.00");
    }

    private MarketRegimeFeatures bullFeatures() {
        return new MarketRegimeFeatures(
                LocalDate.of(2026, 5, 29),
                new BigDecimal("2450"),
                new BigDecimal("2380"),
                new BigDecimal("0.008"),
                new BigDecimal("0.015"),
                new BigDecimal("775"),
                new BigDecimal("740"),
                new BigDecimal("0.006"),
                new BigDecimal("0.018"),
                new BigDecimal("0.62"),
                new BigDecimal("0.55"),
                new BigDecimal("0.58"),
                new BigDecimal("0.06")
        );
    }
}
