package com.marketpulse.domain.quant.dto;

public record ExperimentRunRequestDto(
        String strategyNameEn,
        String from,
        String to,
        Long initialCash,
        String objective,
        String validationMode,
        Integer maxVariants
) {
    public long normalizedInitialCash() {
        return initialCash == null || initialCash <= 0 ? 100_000_000L : initialCash;
    }

    public String normalizedObjective() {
        return objective == null || objective.isBlank()
                ? "MONTHLY_RETURN_GTE_10_AFTER_COST"
                : objective;
    }

    public String normalizedValidationMode() {
        return "WALK_FORWARD";
    }

    public int normalizedMaxVariants() {
        if (maxVariants == null || maxVariants <= 0) {
            return 50;
        }
        return Math.min(maxVariants, 100);
    }
}
