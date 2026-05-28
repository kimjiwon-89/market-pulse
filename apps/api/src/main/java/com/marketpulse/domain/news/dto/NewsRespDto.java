package com.marketpulse.domain.news.dto;

import com.marketpulse.global.response.KisResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "뉴스 응답 DTO")
public class NewsRespDto {

    @Schema(description = "뉴스 고유 일련번호", example = "2026041023570099271")
    private String cntt_usiq_srno;

    @Schema(description = "뉴스 제공 업체 코드", example = "6")
    private String news_ofer_entp_code;

    @Schema(description = "날짜 (YYYYMMDD)", example = "20260410")
    private String data_dt;

    @Schema(description = "시간 (HHMMSS)", example = "235700")
    private String data_tm;

    @Schema(description = "뉴스 제목", example = "독일서 이스라엘 식당에 폭발물 공격")
    private String hts_pbnt_titl_cntt;

    @Schema(description = "뉴스 구분 코드", example = "11")
    private String news_lrdv_code;

    @Schema(description = "언론사", example = "연합뉴스")
    private String dorg;

    // 종목 코드들
    private String iscd1;
    private String iscd2;
    private String iscd3;
    private String iscd4;
    private String iscd5;
    private String iscd6;
    private String iscd7;
    private String iscd8;
    private String iscd9;
    private String iscd10;

    // 종목명
    private String kor_isnm1;
    private String kor_isnm2;
    private String kor_isnm3;
    private String kor_isnm4;
    private String kor_isnm5;
    private String kor_isnm6;
    private String kor_isnm7;
    private String kor_isnm8;
    private String kor_isnm9;
    private String kor_isnm10;

}