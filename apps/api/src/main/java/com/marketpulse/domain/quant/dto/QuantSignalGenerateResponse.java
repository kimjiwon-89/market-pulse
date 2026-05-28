package com.marketpulse.domain.quant.dto;

public record QuantSignalGenerateResponse(
        String modelCode,
        String signalDate,
        int generatedCount
) {}
