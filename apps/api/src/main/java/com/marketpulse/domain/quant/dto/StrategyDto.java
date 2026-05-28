package com.marketpulse.domain.quant.dto;

import java.util.Map;

public record StrategyDto(
        Long id,
        String name,
        String nameEn,
        String description,
        String assetType,
        String rebalanceCycle,
        Map<String, Object> params
) {}
