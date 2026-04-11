package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업종 지수 일별 데이터
 */
@Getter
@Setter
@Schema(description = "업종 지수 일별 데이터")
public class IndexDailyItem {

    @Schema(description="영업일", example="20260220")
    private String stck_bsop_date;

    @Schema(description="현재 지수", example="1154.00")
    private Double bstp_nmix_prpr;

    @Schema(description="시가", example="1161.40")
    private Double bstp_nmix_oprc;

    @Schema(description="고가", example="1162.62")
    private Double bstp_nmix_hgpr;

    @Schema(description="저가", example="1147.72")
    private Double bstp_nmix_lwpr;

    @Schema(description="거래량", example="1331918")
    private Long acml_vol;

    @Schema(description="거래대금", example="12405283")
    private Long acml_tr_pbmn;

    @Schema(description="수정 여부", example="N")
    private String mod_yn;

}
