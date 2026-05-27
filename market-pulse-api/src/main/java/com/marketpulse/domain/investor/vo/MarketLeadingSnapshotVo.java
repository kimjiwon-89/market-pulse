package com.marketpulse.domain.investor.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MarketLeadingSnapshotVo {
    private Long id;
    private LocalDate snapDate;
    private String market;
    private Long shortSellVol;
    private Long shortSellAmt;
    private Long lvrgVol;
    private Long invrsVol;
}
