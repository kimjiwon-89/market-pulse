package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class QuantExperimentVariantVo {
    private Long id;
    private Long runId;
    private String variantCode;
    private String params;
    private BigDecimal totalReturn;
    private BigDecimal annualizedReturn;
    private BigDecimal monthlyReturn;
    private BigDecimal mdd;
    private BigDecimal sharpeRatio;
    private BigDecimal turnover;
    private Long totalCost;
    private Boolean targetAchieved;
    private String biasCheckStatus;
    private BigDecimal overfitScore;
    private Boolean promoted;
    private LocalDateTime createdAt;
}
