package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockSearchResultDto {

    private String code;
    private String name;
    private String market;
    private String sector;
}
