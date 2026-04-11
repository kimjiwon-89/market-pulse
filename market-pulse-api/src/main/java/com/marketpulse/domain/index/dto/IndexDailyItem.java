package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업종 지수 일별 데이터
 */
@Getter
@Setter
@Schema(description = "업종 지수 일별 데이터(output2)")
public class IndexDailyItem {
    @Schema(description="영업일자", example="20260220")
    private String stck_bsop_date;

    @Schema(description="업종 지수 현재가", example="1154.00")
    private String bstp_nmix_prpr;

    @Schema(description="업종 지수 시가", example="1161.40")
    private String bstp_nmix_oprc;

    @Schema(description="업종 지수 최고가", example="1162.62")
    private String bstp_nmix_hgpr;

    @Schema(description="업종 지수 최저가", example="1147.72")
    private String bstp_nmix_lwpr;

    @Schema(description="누적 거래량", example="1331918")
    private String acml_vol;

    @Schema(description="누적 거래 대금", example="12405283")
    private String acml_tr_pbmn;

    @Schema(description="수정 여부", example="N")
    private String mod_yn;

}
