package com.marketpulse.domain.quant.dto;

public record BacktestRequestDto(
        Long strategyId,
        String from,
        String to,
        Long initialCash
) {
    public long normalizedInitialCash() {
        return initialCash == null ? 100_000_000L : initialCash;
    }
}
