package com.marketpulse.domain.quant.dto;

public record QuantFeatureGenerateResponse(
        String modelCode,
        String from,
        String to,
        int generatedCount
) {}
