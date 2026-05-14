package com.marketpulse.domain.lotto.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class LottoUserComboRequestDto {
    private int drawNo;
    private List<Integer> numbers;  // 6개
}
