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
public class QuantExperimentRunVo {
    private Long id;
    private String strategyNameEn;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long initialCash;
    private String objective;
    private String validationMode;
    private BigDecimal targetMonthlyReturn;
    private Boolean targetIsGuarantee;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
