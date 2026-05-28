package com.marketpulse.domain.quant.live.dto;

import java.math.BigDecimal;
import java.util.List;

public record WatchedAssetDto(
        Long watchId,
        String modelCode,
        String assetCode,
        String assetName,
        String trackingSource,
        String originalDecisionType,
        String originalModelReason,
        BigDecimal decisionPrice,
        List<OutcomeCheckpointDto> checkpoints
) {
}
