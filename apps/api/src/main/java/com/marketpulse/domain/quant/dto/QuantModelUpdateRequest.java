package com.marketpulse.domain.quant.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

public record QuantModelUpdateRequest(
        @Size(max = 120) String displayName,
        String description,
        @Size(max = 30) String modelType,
        String implementationKey,
        Map<String, Object> configSchema,
        Map<String, Object> defaultConfig,
        Boolean isActive
) {}
