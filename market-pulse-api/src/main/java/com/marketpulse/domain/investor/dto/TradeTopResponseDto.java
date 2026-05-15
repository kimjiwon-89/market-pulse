package com.marketpulse.domain.investor.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TradeTopResponseDto {
    private int rank;
    private String stockCode;
    private String stockName;
    private long netBuyAmount;
    private long netBuyVolume;
    private long currentPrice;
    private double changeRate;
    private double foreignShareRatio;
}
