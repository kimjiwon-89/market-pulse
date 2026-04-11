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
    @Schema(description = "종목명", example = "한화에어로스페이스")
    private String hts_kor_isnm;

    @Schema(description = "종목코드", example = "012450")
    private String mksc_shrn_iscd;

    @Schema(description = "순위", example = "1")
    private Integer data_rank;

    @Schema(description = "현재가", example = "1488000")
    private Long stck_prpr;

    @Schema(description = "전일 대비 부호 (1:상한,2:상승,3:보합,4:하한,5:하락)", example = "2")
    private String prdy_vrss_sign;

    @Schema(description = "전일 대비 가격", example = "23000")
    private Long prdy_vrss;

    @Schema(description = "등락률", example = "1.57")
    private Double prdy_ctrt;

    @Schema(description = "누적 거래량", example = "324291")
    private Long acml_vol;

    @Schema(description = "전일 거래량", example = "0")
    private Long prdy_vol;

    @Schema(description = "상장주식수", example = "0")
    private Long lstn_stcn;

    @Schema(description = "평균 거래량", example = "0")
    private Long avrg_vol;

    @Schema(description = "전일 대비 가격 비율", example = "0.00")
    private Double n_befr_clpr_vrss_prpr_rate;

    @Schema(description = "거래량 증가율", example = "0.00")
    private Double vol_inrt;

    @Schema(description = "거래 회전율", example = "0.00")
    private Double vol_tnrt;

    @Schema(description = "N일 거래 회전율", example = "0.00")
    private Double nday_vol_tnrt;

    @Schema(description = "평균 거래대금", example = "0")
    private Long avrg_tr_pbmn;

    @Schema(description = "거래대금 회전율", example = "0.00")
    private Double tr_pbmn_tnrt;

    @Schema(description = "N일 거래대금 회전율", example = "0.00")
    private Double nday_tr_pbmn_tnrt;

    @Schema(description = "누적 거래대금", example = "0")
    private Long acml_tr_pbmn;
}
