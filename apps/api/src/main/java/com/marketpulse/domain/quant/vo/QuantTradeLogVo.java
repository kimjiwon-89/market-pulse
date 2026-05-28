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
public class QuantTradeLogVo {
    private Long id;
    private Long strategyId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private LocalDate tradeDate;
    private String assetCode;
    private String assetName;
    private String assetType;
    private String tradeType;
    private BigDecimal price;
    private Long quantity;
    private Long amount;
    private BigDecimal weight;
    private String reason;
    private Long commission;
    private Long tax;
    private LocalDateTime createdAt;
}
