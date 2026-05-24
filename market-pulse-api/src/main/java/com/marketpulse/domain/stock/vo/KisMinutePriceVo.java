package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KisMinutePriceVo {
    @JsonProperty("stck_bsop_date") private String date;
    @JsonProperty("stck_cntg_hour") private String time;
    @JsonProperty("stck_prpr") private String closePrice;
    @JsonProperty("stck_oprc") private String openPrice;
    @JsonProperty("stck_hgpr") private String highPrice;
    @JsonProperty("stck_lwpr") private String lowPrice;
    @JsonProperty("cntg_vol") private String volume;
    @JsonProperty("acml_tr_pbmn") private String tradeAmount;
}
