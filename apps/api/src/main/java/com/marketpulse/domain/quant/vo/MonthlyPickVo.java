package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MonthlyPickVo {
    private LocalDate rebalanceDate;
    private LocalDate exitDate;
    private String assetCode;
    private String assetName;
    private String assetType;
    private String sector;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal score;
    private Long marketCap;
    private Integer pickRank;
}
