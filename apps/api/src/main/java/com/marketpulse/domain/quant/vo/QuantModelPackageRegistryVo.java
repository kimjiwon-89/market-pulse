package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class QuantModelPackageRegistryVo {
    private String modelCode;
    private String modelName;
    private String modelVersion;
    private String category;
    private String description;
    private String packagePath;
    private String packageStatus;
    private Boolean publicVisible;
    private Boolean runtimeReady;
    private String adminNote;
    private BigDecimal seedMoney;
    private BigDecimal expectedMonthlyReturnPct;
    private LocalDateTime discoveredAt;
    private LocalDateTime updatedAt;
}
