package com.marketpulse.domain.stock.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StockReportDto {
    private String source;
    private String title;
    private String publishedAt;
    private String url;
    private String summary;
    private String licenseStatus;
}
