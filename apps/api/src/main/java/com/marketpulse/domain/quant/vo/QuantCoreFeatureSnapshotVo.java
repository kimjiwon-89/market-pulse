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
public class QuantCoreFeatureSnapshotVo {
    private Long id;
    private String modelCode;
    private LocalDate signalDate;
    private String assetCode;
    private String assetName;
    private String market;
    private String sector;
    private String features;
    private String preprocessingMeta;
    private String label;
    private BigDecimal forwardReturn;
    private BigDecimal benchmarkReturn;
    private LocalDateTime createdAt;
}
