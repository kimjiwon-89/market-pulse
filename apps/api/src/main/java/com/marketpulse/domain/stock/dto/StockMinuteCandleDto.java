package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockMinuteCandleDto {
    private String code;
    private String time;
    private long open;
    private long high;
    private long low;
    private long close;
    private long volume;
    private long tradeAmount;
    private String source;
}
