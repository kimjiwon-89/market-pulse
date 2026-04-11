package com.marketpulse.domain.index.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업종 지수 현재 정보
 */
@Getter
@Setter
@Schema(description = "업종 지수 현재 정보(output1)")
public class IndexCurrentItem {

    @Schema(description="업종 지수 전일 대비", example="-6.71")
    private String bstp_nmix_prdy_vrss;

    @Schema(description="전일 대비 부호 (1:상한,2:상승,3:보합,4:하한,5:하락)", example="5")
    private String prdy_vrss_sign;

    @Schema(description="업종 지수 전일 대비율", example="-0.58")
    private String bstp_nmix_prdy_ctrt;

    @Schema(description="업종 지수", example="1160.71")
    private String prdy_nmix;

    @Schema(description="누적 거래량", example="1331918")
    private String acml_vol;

    @Schema(description="누적 거래 대금", example="12405283")
    private String acml_tr_pbmn;

    @Schema(description="업종명", example="KOSDAQ")
    private String hts_kor_isnm;

    @Schema(description="업종 지수 현재가", example="1154.00")
    private String bstp_nmix_prpr;

    @Schema(description="업종 분류 코드", example="1001")
    private String bstp_cls_code;

    @Schema(description="전일 거래량", example="1351785")
    private String prdy_vol;

    @Schema(description="업종 지수 시가", example="1161.40")
    private String bstp_nmix_oprc;

    @Schema(description="업종 지수 최고가", example="1162.62")
    private String bstp_nmix_hgpr;

    @Schema(description="업종 지수 최저가", example="1147.72")
    private String bstp_nmix_lwpr;

    @Schema(description="선물 전일 시가", example="1122.20")
    private String futs_prdy_oprc;

    @Schema(description="선물 전일 최고가", example="1163.66")
    private String futs_prdy_hgpr;

    @Schema(description="선물 전일 최저가", example="1111.28")
    private String futs_prdy_lwpr;

}