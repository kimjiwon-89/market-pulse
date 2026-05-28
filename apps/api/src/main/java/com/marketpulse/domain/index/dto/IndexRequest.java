package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "업종 지수 조회 요청")
public class IndexRequest {

    @Schema(description = "업종 코드 (0001:코스피, 1001:코스닥, 2001:코스피200)", example = "0001")
    private String indexCode;

    @Schema(description = "시작일자 (미입력 시 30일 전)", example = "20260101")
    private String fid_input_date_1;

    @Schema(description = "종료일자 (미입력 시 오늘)", example = "20260514")
    private String fid_input_date_2;
}