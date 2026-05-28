package com.marketpulse.domain.quant.dto;

import java.util.List;

public record QuantCandidateDetailDto(
        QuantCandidateSignalDto candidate,
        List<FactorScoreItemDto> factorBreakdown,
        List<String> reasonChips,
        List<TriggerConditionDto> triggerConditions,
        List<SignalHistoryItemDto> signalHistory
) {}
