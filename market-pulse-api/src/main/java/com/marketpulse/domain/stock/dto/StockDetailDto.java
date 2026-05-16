package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockDetailDto {

    private String code;
    private String name;
    private long   currentPrice;
    private long   prdyVrss;
    private String prdyVrssSign;
    private double changeRate;
    private long   volume;
    private long   tradingValue;
    private long   marketCap;
    private long   openPrice;
    private long   highPrice;
    private long   lowPrice;
    private double per;
    private double pbr;
    private long   weekHigh;
    private long   weekLow;
}
