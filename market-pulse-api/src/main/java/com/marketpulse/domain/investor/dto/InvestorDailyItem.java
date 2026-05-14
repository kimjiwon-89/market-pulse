package com.marketpulse.domain.investor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InvestorDailyItem {

    @JsonProperty("stck_bsop_date")
    private String date;

    @JsonProperty("stck_clpr")
    private String closingPrice;

    @JsonProperty("prsn_ntby_qty")
    private String personalNetBuyQty;

    @JsonProperty("frgn_ntby_qty")
    private String foreignNetBuyQty;

    @JsonProperty("orgn_ntby_qty")
    private String institutionNetBuyQty;

    @JsonProperty("prsn_ntby_tr_pbmn")
    private String personalNetBuyAmount;

    @JsonProperty("frgn_ntby_tr_pbmn")
    private String foreignNetBuyAmount;

    @JsonProperty("orgn_ntby_tr_pbmn")
    private String institutionNetBuyAmount;

    @JsonProperty("prsn_shnu_vol")
    private String personalBuyVol;

    @JsonProperty("frgn_shnu_vol")
    private String foreignBuyVol;

    @JsonProperty("orgn_shnu_vol")
    private String institutionBuyVol;

    @JsonProperty("prsn_shnu_tr_pbmn")
    private String personalBuyAmount;

    @JsonProperty("frgn_shnu_tr_pbmn")
    private String foreignBuyAmount;

    @JsonProperty("orgn_shnu_tr_pbmn")
    private String institutionBuyAmount;

    @JsonProperty("prsn_seln_vol")
    private String personalSellVol;

    @JsonProperty("frgn_seln_vol")
    private String foreignSellVol;

    @JsonProperty("orgn_seln_vol")
    private String institutionSellVol;

    @JsonProperty("prsn_seln_tr_pbmn")
    private String personalSellAmount;

    @JsonProperty("frgn_seln_tr_pbmn")
    private String foreignSellAmount;

    @JsonProperty("orgn_seln_tr_pbmn")
    private String institutionSellAmount;
}
