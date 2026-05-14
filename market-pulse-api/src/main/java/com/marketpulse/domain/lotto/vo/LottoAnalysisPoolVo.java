package com.marketpulse.domain.lotto.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class LottoAnalysisPoolVo {
    private Long id;
    private int drawNo;
    private String strategy;
    private int[] poolNumbers;
    private String combos;  // JSONB → JSON 문자열로 저장
    private LocalDateTime createdAt;
}
