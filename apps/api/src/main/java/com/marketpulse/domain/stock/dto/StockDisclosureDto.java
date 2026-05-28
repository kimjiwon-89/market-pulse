package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockDisclosureDto {
    private String code;
    private String title;
    private String filedAt;
    private String source;
    private String url;
}
