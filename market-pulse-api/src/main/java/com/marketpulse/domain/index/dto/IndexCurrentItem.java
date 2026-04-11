package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업종 지수 현재 정보
 */
@Getter
@Setter
@Schema(description = "업종 지수 현재 정보")
public class IndexCurrentItem {

    @Schema(description="업종명", example="KOSDAQ")
    private String hts_kor_isnm;

    @Schema(description="업종 코드", example="1001")
    private String bstp_cls_code;

    @Schema(description="현재 지수", example="1154.00")
    private Double bstp_nmix_prpr;

    @Schema(description="전일 대비", example="-6.71")
    private Double bstp_nmix_prdy_vrss;

    @Schema(description="전일 대비 부호", example="5")
    private String prdy_vrss_sign;

    @Schema(description="등락률", example="-0.58")
    private Double bstp_nmix_prdy_ctrt;

    @Schema(description="시가", example="1161.40")
    private Double bstp_nmix_oprc;

    @Schema(description="고가", example="1162.62")
    private Double bstp_nmix_hgpr;

    @Schema(description="저가", example="1147.72")
    private Double bstp_nmix_lwpr;

    @Schema(description="누적 거래량", example="1331918")
    private Long acml_vol;

    @Schema(description="누적 거래대금", example="12405283")
    private Long acml_tr_pbmn;

    @Schema(description="전일 거래량", example="1351785")
    private Long prdy_vol;

}