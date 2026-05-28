package com.marketpulse.domain.quant.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record QuantModelDto(
        Long id,
        String modelCode,
        String displayName,
        String description,
        String modelType,
        String implementationType,
        String implementationKey,
        Map<String, Object> configSchema,
        Map<String, Object> defaultConfig,
        Boolean isUserDefined,
        Boolean isActive,
        Boolean runnable,
        String createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
