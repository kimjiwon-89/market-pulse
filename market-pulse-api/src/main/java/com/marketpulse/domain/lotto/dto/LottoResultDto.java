package com.marketpulse.domain.lotto.dto;

import com.marketpulse.domain.lotto.vo.LottoResultVo;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class LottoResultDto {
    private final int drawNo;
    private final LocalDate drawDate;
    private final int[] numbers;
    private final int bonusNo;

    public LottoResultDto(LottoResultVo vo) {
        this.drawNo   = vo.getDrawNo();
        this.drawDate = vo.getDrawDate();
        this.numbers  = vo.getNumbers();
        this.bonusNo  = vo.getBonusNo();
    }
}
