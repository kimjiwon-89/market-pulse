package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class QuantStrategyVo {
    private Long id;
    private String name;
    private String nameEn;
    private String description;
    private String assetType;
    private String rebalanceCycle;
    private String params;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
