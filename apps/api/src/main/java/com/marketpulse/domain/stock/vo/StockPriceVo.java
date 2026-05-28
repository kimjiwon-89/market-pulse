package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StockPriceVo {

    @JsonProperty("hts_kor_isnm")   private String stockName;
    @JsonProperty("stck_shrn_iscd") private String shortCode;
    @JsonProperty("stck_prpr")      private String currentPrice;
    @JsonProperty("prdy_vrss")      private String prdyVrss;
    @JsonProperty("prdy_vrss_sign") private String prdyVrssSign;
    @JsonProperty("prdy_ctrt")      private String changeRate;
    @JsonProperty("acml_vol")       private String volume;
    @JsonProperty("acml_tr_pbmn")   private String tradingValue;
    @JsonProperty("hts_avls")       private String marketCap;
    @JsonProperty("stck_oprc")      private String openPrice;
    @JsonProperty("stck_hgpr")      private String highPrice;
    @JsonProperty("stck_lwpr")      private String lowPrice;
    @JsonProperty("per")            private String per;
    @JsonProperty("pbr")            private String pbr;
    @JsonProperty("w52_hgpr")       private String weekHigh;
    @JsonProperty("w52_lwpr")       private String weekLow;
}
