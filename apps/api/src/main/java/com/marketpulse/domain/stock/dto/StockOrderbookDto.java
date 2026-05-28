package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StockOrderbookDto {
    private String code;
    private String timestamp;
    private List<OrderbookLevel> asks;
    private List<OrderbookLevel> bids;
    private long expectedPrice;
    private long expectedVolume;

    @Getter
    @Builder
    public static class OrderbookLevel {
        private long price;
        private long volume;
        private int level;
    }
}
