package com.marketpulse.domain.index.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class IndexSnapshotVo {
    private Long id;
    private LocalDate snapDate;
    private String indexCode;
    private String indexName;
    private String currentPrice;
    private String changeAmount;
    private String changeRate;
    private String tradeVolume;
    private String tradeAmount;
    private String dailyJson;
}
