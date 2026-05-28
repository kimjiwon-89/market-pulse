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
public class QuantBacktestResultVo {
    private Long id;
    private Long strategyId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private LocalDate tradeDate;
    private Long portfolioValue;
    private BigDecimal returnPct;
    private Long cash;
    private Long equity;
    private LocalDateTime createdAt;
}
