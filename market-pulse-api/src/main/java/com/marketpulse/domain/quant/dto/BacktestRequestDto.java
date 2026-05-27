package com.marketpulse.domain.quant.dto;

public record BacktestRequestDto(
        Long strategyId,
        String from,
        String to,
        Long initialCash
) {
    public long normalizedStrategyId() {
        return strategyId == null ? 1L : strategyId;
    }

    public long normalizedInitialCash() {
        return initialCash == null ? 100_000_000L : initialCash;
    }
}
