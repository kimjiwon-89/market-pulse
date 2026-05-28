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
public class QuantCoreSignalVo {
    private Long id;
    private String modelCode;
    private Long modelVersionId;
    private LocalDate signalDate;
    private String assetCode;
    private String assetName;
    private String market;
    private String sector;
    private BigDecimal winnerProb;
    private BigDecimal neutralProb;
    private BigDecimal loserProb;
    private BigDecimal score;
    private Integer rank;
    private BigDecimal targetWeight;
    private String reason;
    private String riskFlags;
    private LocalDateTime createdAt;
}
