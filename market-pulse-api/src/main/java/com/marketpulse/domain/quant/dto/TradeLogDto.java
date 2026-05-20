package com.marketpulse.domain.quant.dto;

public record TradeLogDto(
        Long id,
        String tradeDate,
        String assetCode,
        String assetName,
        String assetType,
        String tradeType,
        long price,
        long quantity,
        long amount,
        double weight,
        String reason,
        long commission,
        long tax
) {}
