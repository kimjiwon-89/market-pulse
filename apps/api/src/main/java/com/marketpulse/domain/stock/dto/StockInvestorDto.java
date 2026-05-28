package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockInvestorDto {

    private long foreignBuy;
    private long foreignSell;
    private long foreignNet;
    private long institutionBuy;
    private long institutionSell;
    private long institutionNet;
    private long individualBuy;
    private long individualSell;
    private long individualNet;
}
