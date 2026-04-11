package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업종 지수 조회 요청
 */
@Getter
@Setter
@Schema(description = "업종 지수 조회 요청")
public class IndexRequest {

    @Schema(
            description = "시장 코드 (0001:코스피, 1001:코스닥)",
            example = "1001"
    )
    private String fid_input_iscd;

    @Schema(
            description = "시작일자",
            example = "20260101"
    )
    private String fid_input_date_1;

    @Schema(
            description = "종료일자",
            example = "20260220"
    )
    private String fid_input_date_2;

}