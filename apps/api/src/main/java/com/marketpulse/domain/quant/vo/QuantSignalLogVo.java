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
public class QuantSignalLogVo {
    private Long id;
    private Long runId;
    private Long variantId;
    private String strategyNameEn;
    private LocalDate signalDate;
    private LocalDate executionDate;
    private String assetCode;
    private String assetName;
    private BigDecimal signalScore;
    private Boolean selected;
    private LocalDateTime createdAt;
}
