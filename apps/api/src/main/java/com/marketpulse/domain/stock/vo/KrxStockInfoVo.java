package com.marketpulse.domain.stock.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KrxStockInfoVo {

    @JsonProperty("ISU_SRT_CD") private String isuSrtCd;  // 단축코드 6자리
    @JsonProperty("ISU_NM")     private String isuNm;     // 한글 종목명
    @JsonProperty("ISU_ABBRV") private String isuAbbrv;  // 한글 종목약명
    @JsonProperty("MKT_TP_NM") private String mktTpNm;   // 시장구분 (유가증권/코스닥/코넥스)
    @JsonProperty("SECT_TP_NM") private String sectTpNm;  // 소속부 (없으면 "-")
}
