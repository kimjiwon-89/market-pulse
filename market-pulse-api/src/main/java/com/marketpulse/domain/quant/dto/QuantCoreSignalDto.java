package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record QuantCoreSignalDto(
        Long id,
        String modelCode,
        Long modelVersionId,
        LocalDate signalDate,
        String assetCode,
        String assetName,
        String market,
        String sector,
        BigDecimal winnerProb,
        BigDecimal neutralProb,
        BigDecimal loserProb,
        BigDecimal score,
        Integer rank,
        BigDecimal targetWeight,
        Map<String, Object> reason,
        Map<String, Object> riskFlags
) {}
