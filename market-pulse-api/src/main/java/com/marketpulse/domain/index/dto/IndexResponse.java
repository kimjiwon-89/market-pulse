package com.marketpulse.domain.index.dto;

import com.marketpulse.global.response.KisResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 업종 지수 응답 DTO
 */
@Getter
@Setter
@Schema(description = "업종 지수 조회 응답")
public class IndexResponse extends KisResponse {

    @Schema(description="현재 지수 정보")
    private IndexCurrentItem output1;

    @Schema(description="일별 지수 리스트")
    private List<IndexDailyItem> output2;

}
