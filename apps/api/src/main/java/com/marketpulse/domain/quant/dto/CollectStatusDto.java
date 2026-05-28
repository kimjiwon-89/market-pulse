package com.marketpulse.domain.quant.dto;

public record CollectStatusDto(
        String status,
        double progress,
        int processedDates,
        int totalDates,
        int collectedDates,
        String latestDate,
        String message
) {
    public static CollectStatusDto idle() {
        return new CollectStatusDto("IDLE", 0, 0, 0, 0, null, null);
    }
}
