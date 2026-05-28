package com.marketpulse.domain.investor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TradeTopItem {

    @JsonProperty("mksc_shrn_iscd")
    private String stockCode;

    @JsonProperty("hts_kor_isnm")
    private String stockName;

    @JsonProperty("ntby_qty")
    private String netBuyVolume;

    @JsonProperty("seln_qty")
    private String sellVolume;

    @JsonProperty("shnu_qty")
    private String buyVolume;

    @JsonProperty("stck_prpr")
    private String currentPrice;

    @JsonProperty("prdy_vrss")
    private String priceChange;

    @JsonProperty("prdy_ctrt")
    private String changeRate;

    @JsonProperty("ntby_tr_pbmn")
    private String netBuyAmount;
}
