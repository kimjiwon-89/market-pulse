package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StockDailyPriceVo {

    @JsonProperty("stck_bsop_date") private String date;
    @JsonProperty("stck_clpr")      private String closePrice;
    @JsonProperty("stck_oprc")      private String openPrice;
    @JsonProperty("stck_hgpr")      private String highPrice;
    @JsonProperty("stck_lwpr")      private String lowPrice;
    @JsonProperty("acml_vol")       private String volume;
    @JsonProperty("prdy_vrss")      private String prdyVrss;
    @JsonProperty("prdy_ctrt")      private String changeRate;
}
