package com.marketpulse.domain.quant.live.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class MarketRegimeEngine {
    private static final BigDecimal CRASH_BREADTH_MAX = new BigDecimal("0.20");
    private static final BigDecimal CRASH_VOL_MIN = new BigDecimal("0.040");
    private static final BigDecimal VOL_NORMAL_MAX = new BigDecimal("0.025");
    private static final BigDecimal VOL_ELEVATED = new BigDecimal("0.030");
    private static final int BULL_SCORE_MIN = 7;
    private static final int BEAR_SCORE_MIN = 5;
    private static final Map<String, Integer> REGIME_RANK = Map.of(
            "CRASH", 0,
            "BEAR", 1,
            "SIDEWAYS", 2,
            "BULL", 3
    );

    public MarketRegimeSnapshot classify(
            MarketRegimeFeatures features,
            BigDecimal liveKospi,
            BigDecimal liveKosdaq,
            LocalDate tradeDate
    ) {
        FeatureState state = FeatureState.from(features, liveKospi, liveKosdaq);
        String kospiRegime = classifySingle(
                state.kospiAboveMa20,
                state.kospiAboveMa60,
                nz(features.kospiMa20Slope5d()),
                nz(features.kospiVol20()),
                nz(features.breadthMa20()),
                nz(features.liquidityTrend())
        );
        String kosdaqRegime = classifySingle(
                state.kosdaqAboveMa20,
                state.kosdaqAboveMa60,
                nz(features.kosdaqMa20Slope5d()),
                nz(features.kosdaqVol20()),
                nz(features.advanceRatio5d()),
                nz(features.liquidityTrend())
        );
        String combined = moreConservative(kospiRegime, kosdaqRegime);
        int bullScore = bullScore(state, features);
        int bearScore = bearScore(state, features);
        int stressScore = stressScore(state, features);
        return new MarketRegimeSnapshot(
                tradeDate,
                features.cacheDate(),
                liveKospi,
                liveKosdaq,
                kospiRegime,
                kosdaqRegime,
                allowedStrategy(kospiRegime),
                allowedStrategy(kosdaqRegime),
                riskBudget(kospiRegime),
                riskBudget(kosdaqRegime),
                combined,
                allowedStrategy(combined),
                confidence(combined, bullScore, bearScore),
                riskBudget(combined),
                bullScore,
                bearScore,
                stressScore,
                nz(features.breadthMa20()),
                nz(features.breadthMa60()),
                state.volatility20,
                nz(features.liquidityTrend()),
                LocalDateTime.now()
        );
    }

    private String classifySingle(
            boolean aboveMa20,
            boolean aboveMa60,
            BigDecimal slope,
            BigDecimal vol,
            BigDecimal breadthProxy,
            BigDecimal liquidityTrend
    ) {
        if (lte(breadthProxy, CRASH_BREADTH_MAX) && gte(vol, CRASH_VOL_MIN) && !aboveMa60) {
            return "CRASH";
        }
        int bull = score(
                aboveMa20,
                aboveMa60,
                gt(slope, BigDecimal.ZERO),
                gte(breadthProxy, new BigDecimal("0.55")),
                lte(vol, VOL_NORMAL_MAX),
                gte(liquidityTrend, BigDecimal.ZERO)
        );
        int bear = score(
                !aboveMa60,
                lt(slope, BigDecimal.ZERO),
                lte(breadthProxy, new BigDecimal("0.35")),
                gte(vol, VOL_ELEVATED),
                lt(liquidityTrend, BigDecimal.ZERO)
        );
        if (bull >= 5) return "BULL";
        if (bear >= 4) return "BEAR";
        return "SIDEWAYS";
    }

    private int bullScore(FeatureState state, MarketRegimeFeatures features) {
        return score(
                state.kospiAboveMa20,
                state.kosdaqAboveMa20,
                state.kospiAboveMa60,
                state.kosdaqAboveMa60,
                gt(nz(features.kospiMa20Slope5d()), BigDecimal.ZERO),
                gt(nz(features.kosdaqMa20Slope5d()), BigDecimal.ZERO),
                gte(nz(features.breadthMa20()), new BigDecimal("0.55")),
                lte(state.volatility20, VOL_NORMAL_MAX),
                gte(nz(features.liquidityTrend()), BigDecimal.ZERO)
        );
    }

    private int bearScore(FeatureState state, MarketRegimeFeatures features) {
        return score(
                !state.kospiAboveMa60,
                !state.kosdaqAboveMa60,
                lt(nz(features.kospiMa20Slope5d()), BigDecimal.ZERO),
                lt(nz(features.kosdaqMa20Slope5d()), BigDecimal.ZERO),
                lte(nz(features.breadthMa20()), new BigDecimal("0.35")),
                gte(state.volatility20, VOL_ELEVATED),
                lt(nz(features.liquidityTrend()), BigDecimal.ZERO)
        );
    }

    private int stressScore(FeatureState state, MarketRegimeFeatures features) {
        return score(
                !state.kospiAboveMa20,
                !state.kosdaqAboveMa20,
                lte(nz(features.breadthMa20()), new BigDecimal("0.40")),
                gte(state.volatility20, new BigDecimal("0.020")),
                lte(nz(features.advanceRatio5d()), new BigDecimal("0.40"))
        );
    }

    private String moreConservative(String left, String right) {
        return REGIME_RANK.get(left) <= REGIME_RANK.get(right) ? left : right;
    }

    private String allowedStrategy(String regime) {
        return switch (regime) {
            case "BULL" -> "W4_BREAKOUT";
            case "BEAR" -> "W4_RECOVER";
            case "CRASH" -> "CASH";
            default -> "W4_RESTRICT";
        };
    }

    private BigDecimal riskBudget(String regime) {
        return switch (regime) {
            case "BULL" -> new BigDecimal("1.00");
            case "BEAR" -> new BigDecimal("0.20");
            case "CRASH" -> BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY);
            default -> new BigDecimal("0.50");
        };
    }

    private BigDecimal confidence(String regime, int bullScore, int bearScore) {
        if ("CRASH".equals(regime)) return BigDecimal.ONE.setScale(2, RoundingMode.UNNECESSARY);
        if ("BULL".equals(regime)) {
            return minOne(new BigDecimal("0.50").add(new BigDecimal(Math.max(0, bullScore - BULL_SCORE_MIN)).multiply(new BigDecimal("0.10"))));
        }
        if ("BEAR".equals(regime)) {
            return minOne(new BigDecimal("0.50").add(new BigDecimal(Math.max(0, bearScore - BEAR_SCORE_MIN)).multiply(new BigDecimal("0.10"))));
        }
        int margin = Math.min(BULL_SCORE_MIN - bullScore, BEAR_SCORE_MIN - bearScore);
        BigDecimal value = new BigDecimal("0.50").add(new BigDecimal(margin).multiply(new BigDecimal("0.05")));
        return value.max(new BigDecimal("0.30")).min(new BigDecimal("0.70")).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal minOne(BigDecimal value) {
        return value.min(BigDecimal.ONE).setScale(2, RoundingMode.HALF_UP);
    }

    private int score(boolean... values) {
        int score = 0;
        for (boolean value : values) {
            if (value) score++;
        }
        return score;
    }

    private boolean gt(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) > 0;
    }

    private boolean gte(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) >= 0;
    }

    private boolean lt(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) < 0;
    }

    private boolean lte(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) <= 0;
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private record FeatureState(
            boolean kospiAboveMa20,
            boolean kosdaqAboveMa20,
            boolean kospiAboveMa60,
            boolean kosdaqAboveMa60,
            BigDecimal volatility20
    ) {
        static FeatureState from(MarketRegimeFeatures features, BigDecimal liveKospi, BigDecimal liveKosdaq) {
            BigDecimal kospiVol = features.kospiVol20() != null ? features.kospiVol20() : BigDecimal.ZERO;
            BigDecimal kosdaqVol = features.kosdaqVol20() != null ? features.kosdaqVol20() : BigDecimal.ZERO;
            return new FeatureState(
                    liveKospi.compareTo(features.kospiMa20()) > 0,
                    liveKosdaq.compareTo(features.kosdaqMa20()) > 0,
                    liveKospi.compareTo(features.kospiMa60()) > 0,
                    liveKosdaq.compareTo(features.kosdaqMa60()) > 0,
                    kospiVol.max(kosdaqVol)
            );
        }
    }
}
