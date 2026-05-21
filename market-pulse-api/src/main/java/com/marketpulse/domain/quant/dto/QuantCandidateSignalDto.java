package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record QuantCandidateSignalDto(
        String candidateStatus,
        Integer rank,
        String assetCode,
        String assetName,
        String market,
        String sector,
        BigDecimal winnerProb,
        BigDecimal score,
        BigDecimal currentWeight,
        BigDecimal targetWeight,
        String signalState,
        String rebalanceStatus,
        String nextAction,
        String rebalanceDate,
        BigDecimal thresholdDistance,
        List<String> triggerConditions,
        List<String> blockers,
        List<String> riskFlags,
        Map<String, BigDecimal> factorScores,
        List<String> reasonChips
) {}
