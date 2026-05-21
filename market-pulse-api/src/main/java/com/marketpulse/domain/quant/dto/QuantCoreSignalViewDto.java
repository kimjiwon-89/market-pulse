package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record QuantCoreSignalViewDto(
        Integer rank,
        String assetCode,
        String assetName,
        String market,
        String sector,
        BigDecimal winnerProb,
        BigDecimal neutralProb,
        BigDecimal loserProb,
        BigDecimal score,
        BigDecimal targetWeight,
        Map<String, Object> reason,
        List<String> riskFlags
) {}
