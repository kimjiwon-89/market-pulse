package com.marketpulse.domain.quant.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record QuantDiagnosticsDto(
        String modelCode,
        String date,
        Map<String, BigDecimal> featureImportance,
        Map<String, BigDecimal> factorCorrelation,
        Map<String, BigDecimal> sectorExposure,
        List<String> warnings
) {}
