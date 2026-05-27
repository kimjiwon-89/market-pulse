package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class QuantBullV4ReplayFactVo {
    private Long id;
    private String configKey;
    private LocalDate signalDate;
    private LocalDate entryCheckDate;
    private LocalDate entryDate;
    private LocalDate exitDate;
    private String assetCode;
    private String assetName;
    private BigDecimal entryPrice;
    private BigDecimal exitPrice;
    private BigDecimal returnPct;
    private BigDecimal score;
    private String exitReason;
    private BigDecimal positionCash;
    private BigDecimal pnlKrw;
    private BigDecimal capitalReturnPct;
}
