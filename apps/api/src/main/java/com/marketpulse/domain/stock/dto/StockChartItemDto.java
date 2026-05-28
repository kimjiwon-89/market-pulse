package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockChartItemDto {

    private String date;
    private long   close;
    private long   open;
    private long   high;
    private long   low;
    private long   volume;
    private double changeRate;
}
