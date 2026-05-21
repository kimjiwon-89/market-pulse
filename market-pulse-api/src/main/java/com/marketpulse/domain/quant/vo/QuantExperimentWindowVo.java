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
public class QuantExperimentWindowVo {
    private Long id;
    private Long variantId;
    private Integer windowNo;
    private LocalDate trainFrom;
    private LocalDate trainTo;
    private LocalDate validationFrom;
    private LocalDate validationTo;
    private LocalDate testFrom;
    private LocalDate testTo;
    private BigDecimal validationMonthlyReturn;
    private BigDecimal testMonthlyReturn;
    private BigDecimal validationMdd;
    private BigDecimal testMdd;
    private LocalDateTime createdAt;
}
