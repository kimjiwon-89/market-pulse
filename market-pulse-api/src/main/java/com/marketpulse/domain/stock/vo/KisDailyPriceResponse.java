package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** FHKST01010400 전용 — output2(일자별 목록)를 담기 위한 래퍼 */
@Getter
@Setter
public class KisDailyPriceResponse {

    @JsonProperty("rt_cd")   private String rtCd;
    @JsonProperty("msg1")    private String msg1;
    @JsonProperty("output2") private List<StockDailyPriceVo> output2;
}
