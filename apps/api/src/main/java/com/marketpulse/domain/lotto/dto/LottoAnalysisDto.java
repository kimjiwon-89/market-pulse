package com.marketpulse.domain.lotto.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class LottoAnalysisDto {
    private final int drawNo;
    private final LocalDate drawDate;
    private final int[] winningNumbers;   // 실제 당첨번호 (결과 전엔 null)
    private final Integer bonusNo;
    private final List<LottoStrategyDto> strategies;
    private final List<LottoUserComboDto> myCombs;  // 내 저장 조합
}
