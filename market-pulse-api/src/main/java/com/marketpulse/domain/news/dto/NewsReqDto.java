package com.marketpulse.domain.news.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "뉴스 조회 요청 DTO")
public class NewsReqDto {

    @Schema(
            description = "뉴스 제공 업체 코드 (공백 입력)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_NEWS_OFER_ENTP_CODE;

    @Schema(
            description = "조건 시장 구분 코드 (공백 입력)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_COND_MRKT_CLS_CODE;

    @Schema(
            description = "종목코드 (공백: 전체, 종목코드 입력 시 해당 종목 뉴스 조회)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_INPUT_ISCD;

    @Schema(
            description = "제목 내용 (공백 입력)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_TITL_CNTT;

    @Schema(
            description = "입력 날짜 (공백: 현재 기준, 조회일자 형식: 00YYYYMMDD)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_INPUT_DATE_1;

    @Schema(
            description = "입력 시간 (공백: 현재 기준, 조회시간 형식: 0000HHMMSS)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_INPUT_HOUR_1;

    @Schema(
            description = "순위 정렬 구분 코드 (공백 입력)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_RANK_SORT_CLS_CODE;

    @Schema(
            description = "입력 일련번호 (공백 입력)",
            example = "",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String FID_INPUT_SRNO;
}