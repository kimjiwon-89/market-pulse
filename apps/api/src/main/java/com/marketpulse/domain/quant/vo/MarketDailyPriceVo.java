package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MarketDailyPriceVo {
    private Long id;
    private LocalDate tradeDate;
    private String assetCode;
    private String assetType;
    private String assetName;
    private BigDecimal openPrice;
    private BigDecimal highPrice;
    private BigDecimal lowPrice;
    private BigDecimal closePrice;
    private Long volume;
    private Long marketCap;
    private String sector;
    private BigDecimal ytm;
    private LocalDateTime createdAt;
}
