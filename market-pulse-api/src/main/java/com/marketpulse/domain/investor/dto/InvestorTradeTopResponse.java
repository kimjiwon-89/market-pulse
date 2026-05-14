package com.marketpulse.domain.investor.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.marketpulse.global.response.KisResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class InvestorTradeTopResponse extends KisResponse {
    private List<TradeTopItem> output1;

    private Map<String, Object> extraFields = new HashMap<>();

    @JsonAnySetter
    public void setExtraField(String name, Object value) {
        extraFields.put(name, value);
    }
}
