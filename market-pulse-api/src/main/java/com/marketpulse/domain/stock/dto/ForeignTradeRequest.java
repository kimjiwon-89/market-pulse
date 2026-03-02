package com.marketpulse.domain.stock.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForeignTradeRequest {
    @Schema(description = "시장 구분 코드 (고정)", example = "J")
    private String FID_COND_MRKT_DIV_CODE;

    @Schema(description = "화면 분류 코드 (고정)", example = "16441")
    private String FID_COND_SCR_DIV_CODE;

    @Schema(description = "업종코드 - 0000(전체), 1001(코스닥), 2001(코스피)", example = "2001")
    private String FID_INPUT_ISCD;

    @Schema(description = "순위정렬구분코드 - 0(금액순), 1(수량순)", example = "0")
    private String FID_RANK_SORT_CLS_CODE;

    @Schema(description = "순위정렬구분코드2 - 0(매수순), 1(매도순)", example = "0")
    private String FID_RANK_SORT_CLS_CODE_2;
}
