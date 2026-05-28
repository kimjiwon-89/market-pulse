package com.marketpulse.domain.investor.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RankingSnapshotVo {
    private Long id;
    private LocalDate snapDate;
    private String investorType;
    private String tradeType;
    private String market;
    private int rank;
    private String stockCode;
    private String stockName;
    private long netBuyAmount;
    private long netBuyVolume;
}
