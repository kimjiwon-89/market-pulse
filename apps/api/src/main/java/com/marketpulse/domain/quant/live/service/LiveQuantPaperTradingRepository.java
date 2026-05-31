package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LiveQuantPaperTradingRepository {
    void upsertCandidate(PaperCandidate candidate);

    List<PaperCandidate> findCandidates(String modelCode, LocalDate signalDate);

    List<PaperPosition> findOpenPositions(String modelCode);

    Optional<PaperPosition> findOpenPosition(String modelCode, String assetCode);

    void openPosition(PaperPosition position);

    void closePosition(long positionId);

    void insertTrade(PaperTrade trade);

    List<PaperTrade> findTrades(String modelCode);

    record PaperCandidate(
            Long candidateId,
            String modelCode,
            LocalDate signalDate,
            LocalDate marketDate,
            String assetCode,
            String assetName,
            String decision,
            String reason,
            BigDecimal signalPrice,
            BigDecimal expectedReturnPct,
            String source
    ) {
    }

    record PaperPosition(
            Long positionId,
            String modelCode,
            String assetCode,
            String assetName,
            Instant entryTime,
            BigDecimal entryPrice,
            long quantity,
            String status
    ) {
    }

    record PaperTrade(
            Long tradeId,
            String modelCode,
            Long positionId,
            String assetCode,
            String assetName,
            String side,
            Instant fillTime,
            BigDecimal signalPrice,
            BigDecimal fillPrice,
            long quantity,
            BigDecimal realizedReturnPct,
            String reason,
            String source
    ) {
    }
}
