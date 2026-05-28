package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record QuantCoreFeatureSnapshotDto(
        Long id,
        String modelCode,
        LocalDate signalDate,
        String assetCode,
        String assetName,
        String market,
        String sector,
        Map<String, Object> features,
        Map<String, Object> preprocessingMeta,
        String label,
        BigDecimal forwardReturn,
        BigDecimal benchmarkReturn
) {}
