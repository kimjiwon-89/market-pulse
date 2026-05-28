package com.marketpulse.domain.quant.dto;

import java.util.List;

public record TradeLogPageDto(
        int total,
        int page,
        int size,
        List<TradeLogDto> items
) {}
