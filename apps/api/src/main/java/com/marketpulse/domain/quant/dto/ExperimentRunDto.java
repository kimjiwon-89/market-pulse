package com.marketpulse.domain.quant.dto;

import java.util.List;

public record ExperimentRunDto(
        Long id,
        String strategyNameEn,
        String from,
        String to,
        String status,
        double targetMonthlyReturn,
        boolean targetIsGuarantee,
        List<ExperimentVariantDto> variants,
        List<ExperimentWindowDto> windows,
        String message
) {
}
