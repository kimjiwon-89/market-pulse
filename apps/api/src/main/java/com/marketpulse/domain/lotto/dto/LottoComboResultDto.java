package com.marketpulse.domain.lotto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LottoComboResultDto {
    private final List<Integer> combo;
    private final Integer hitCount;  // 결과 확인 전엔 null
}
