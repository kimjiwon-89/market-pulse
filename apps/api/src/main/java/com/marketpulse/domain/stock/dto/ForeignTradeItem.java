package com.marketpulse.domain.stock.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "외국인 매매 추정 종목 정보", name = "ForeignTradeItem")
public class ForeignTradeItem {

    @JsonProperty("stck_shrn_iscd")
    private String stockCode;

    @JsonProperty("hts_kor_isnm")
    private String stockName;

    @JsonProperty("glob_ntsl_qty")
    private String netVolume;

    @JsonProperty("glob_ntby_tr_pbmn")
    private String netBuyAmount;

    @JsonProperty("stck_prpr")
    private String currentPrice;

    @JsonProperty("prdy_ctrt")
    private String changeRate;

    @JsonProperty("glob_total_seln_qty")
    private String totalSellQty;

    @JsonProperty("glob_total_shnu_qty")
    private String totalBuyQty;

    @JsonProperty("frgn_hldn_qty_rt")
    private String foreignShareRatio;
}
