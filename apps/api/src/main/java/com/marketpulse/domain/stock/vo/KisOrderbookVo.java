package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KisOrderbookVo {
    @JsonProperty("askp1") private String askPrice1;
    @JsonProperty("askp2") private String askPrice2;
    @JsonProperty("askp3") private String askPrice3;
    @JsonProperty("askp4") private String askPrice4;
    @JsonProperty("askp5") private String askPrice5;
    @JsonProperty("askp6") private String askPrice6;
    @JsonProperty("askp7") private String askPrice7;
    @JsonProperty("askp8") private String askPrice8;
    @JsonProperty("askp9") private String askPrice9;
    @JsonProperty("askp10") private String askPrice10;
    @JsonProperty("bidp1") private String bidPrice1;
    @JsonProperty("bidp2") private String bidPrice2;
    @JsonProperty("bidp3") private String bidPrice3;
    @JsonProperty("bidp4") private String bidPrice4;
    @JsonProperty("bidp5") private String bidPrice5;
    @JsonProperty("bidp6") private String bidPrice6;
    @JsonProperty("bidp7") private String bidPrice7;
    @JsonProperty("bidp8") private String bidPrice8;
    @JsonProperty("bidp9") private String bidPrice9;
    @JsonProperty("bidp10") private String bidPrice10;

    @JsonProperty("askp_rsqn1") private String askVolume1;
    @JsonProperty("askp_rsqn2") private String askVolume2;
    @JsonProperty("askp_rsqn3") private String askVolume3;
    @JsonProperty("askp_rsqn4") private String askVolume4;
    @JsonProperty("askp_rsqn5") private String askVolume5;
    @JsonProperty("askp_rsqn6") private String askVolume6;
    @JsonProperty("askp_rsqn7") private String askVolume7;
    @JsonProperty("askp_rsqn8") private String askVolume8;
    @JsonProperty("askp_rsqn9") private String askVolume9;
    @JsonProperty("askp_rsqn10") private String askVolume10;
    @JsonProperty("bidp_rsqn1") private String bidVolume1;
    @JsonProperty("bidp_rsqn2") private String bidVolume2;
    @JsonProperty("bidp_rsqn3") private String bidVolume3;
    @JsonProperty("bidp_rsqn4") private String bidVolume4;
    @JsonProperty("bidp_rsqn5") private String bidVolume5;
    @JsonProperty("bidp_rsqn6") private String bidVolume6;
    @JsonProperty("bidp_rsqn7") private String bidVolume7;
    @JsonProperty("bidp_rsqn8") private String bidVolume8;
    @JsonProperty("bidp_rsqn9") private String bidVolume9;
    @JsonProperty("bidp_rsqn10") private String bidVolume10;

    @JsonProperty("antc_cnpr") private String expectedPrice;
    @JsonProperty("antc_cntg_vrss") private String expectedVolume;
}
