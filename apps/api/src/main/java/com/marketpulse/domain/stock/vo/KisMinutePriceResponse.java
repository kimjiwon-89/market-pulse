package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class KisMinutePriceResponse {
    @JsonProperty("rt_cd") private String rtCd;
    @JsonProperty("msg1") private String msg1;
    @JsonProperty("output2") private List<KisMinutePriceVo> output2;
}
