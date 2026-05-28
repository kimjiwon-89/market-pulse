package com.marketpulse.domain.investor.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MarketFlowSnapshotVo {
    private Long id;
    private LocalDate snapDate;
    private String market;
    private long frgnBuy;
    private long frgnSell;
    private long frgnNet;
    private long orgnBuy;
    private long orgnSell;
    private long orgnNet;
    private long indvBuy;
    private long indvSell;
    private long indvNet;
}
