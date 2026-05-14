package com.marketpulse.domain.lotto.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class LottoStrategyDto {
    private final String strategy;       // MOMENTUM | SUBMARINE | NETWORK | PATTERN | AI_PICK
    private final String strategyName;   // 한국어 이름
    private final List<Integer> pool;    // 10개
    private final List<LottoComboResultDto> combos;  // 3개
    private final Integer poolHitCount;  // 결과 확인 후 채워짐 (null 가능)
}
