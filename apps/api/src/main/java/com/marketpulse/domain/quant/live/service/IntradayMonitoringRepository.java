package com.marketpulse.domain.quant.live.service;

import java.time.Instant;
import java.time.LocalDate;

public interface IntradayMonitoringRepository {
    void record(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            RealtimeStockSnapshot snapshot,
            LocalDate signalDate,
            Instant observedAt
    );

    IntradayMonitoringRepository NOOP = (candidate, snapshot, signalDate, observedAt) -> {
    };
}
