package com.marketpulse.domain.quant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record QuantModelCreateRequest(
        @NotBlank @Size(max = 50) String modelCode,
        @NotBlank @Size(max = 120) String displayName,
        String description,
        @NotBlank @Size(max = 30) String modelType,
        String implementationKey,
        Map<String, Object> configSchema,
        Map<String, Object> defaultConfig
) {}
