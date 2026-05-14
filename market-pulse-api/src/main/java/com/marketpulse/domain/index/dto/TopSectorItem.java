package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "상위 업종 정보")
public class TopSectorItem {

    @Schema(description = "업종 코드", example = "0010")
    private String code;

    @Schema(description = "업종명", example = "금융")
    private String name;

    @Schema(description = "현재가", example = "1234.56")
    private double price;

    @Schema(description = "등락률 (%)", example = "1.23")
    private double changeRate;

    @Schema(description = "거래대금 (억 단위)", example = "12345")
    private String volume;

    @Schema(description = "5일 추이 (최근 5일 종가)", example = "[1200, 1210, 1220, 1215, 1234]")
    private double[] history;
}
