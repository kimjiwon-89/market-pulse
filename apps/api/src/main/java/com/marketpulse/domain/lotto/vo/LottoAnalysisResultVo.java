package com.marketpulse.domain.lotto.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class LottoAnalysisResultVo {
    private Long id;
    private int drawNo;
    private String strategy;
    private int poolHitCount;
    private String comboResults;  // JSONB → JSON 문자열
    private LocalDateTime createdAt;
}
