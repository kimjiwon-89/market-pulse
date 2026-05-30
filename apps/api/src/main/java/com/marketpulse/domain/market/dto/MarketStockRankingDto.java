package com.marketpulse.domain.market.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MarketStockRankingDto {
    private int rank;
    private String code;
    private String name;
    private String market;
    private String sector;
    private BigDecimal closePrice;
    private Long volume;
    private BigDecimal tradeAmount;
    private BigDecimal changeRate;
    private LocalDate tradeDate;
    private BigDecimal openPrice;
    private BigDecimal highPrice;
    private BigDecimal lowPrice;
    private Long marketCap;
}
