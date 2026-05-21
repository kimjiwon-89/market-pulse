package com.marketpulse.domain.quant.dto;

public record ExperimentWindowDto(
        Long id,
        Long variantId,
        int windowNo,
        String trainFrom,
        String trainTo,
        String validationFrom,
        String validationTo,
        String testFrom,
        String testTo,
        double validationMonthlyReturn,
        double testMonthlyReturn,
        double validationMdd,
        double testMdd
) {
}
