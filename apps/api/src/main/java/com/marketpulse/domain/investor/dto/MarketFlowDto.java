package com.marketpulse.domain.investor.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MarketFlowDto {
    private String name;
    private long net;
    private long buy;
    private long sell;
}
