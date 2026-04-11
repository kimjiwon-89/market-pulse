package com.marketpulse.domain.stock.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 외국인 매매 추정 종목 DTO
 */
@Getter
@Setter
@Schema(description = "외국인 매매 추정 종목 정보", name = "ForeignTradeItem")
public class ForeignTradeItem {

    @Schema(description = "주식단축종목코드", example = "000250")
    private String stck_shrn_iscd;

    @Schema(description = "종목명", example = "한화에어로스페이스")
    private String hts_kor_isnm;

    @Schema(description = "총 순매수(매도) 수량", example = "60940")
    private Long glob_ntsl_qty;

    @Schema(description = "주식 현재가", example = "1488000")
    private Long stck_prpr;

    @Schema(description = "전일 대비 가격", example = "23000")
    private Long prdy_vrss;

    @Schema(description = "등락률(전일 대비율)", example = "1.57")
    private Double prdy_ctrt;

    @Schema(description = "누적 거래량", example = "324291")
    private Long acml_vol;

    @Schema(description = "외국계 총 순매도 수량", example = "414")
    private Long glob_total_seln_qty;

    @Schema(description = "외국계 총 순매수 수량", example = "61379")
    private Long glob_total_shnu_qty;
}
