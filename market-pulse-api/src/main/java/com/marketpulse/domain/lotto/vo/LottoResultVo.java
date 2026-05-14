package com.marketpulse.domain.lotto.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class LottoResultVo {
    private int drawNo;
    private LocalDate drawDate;
    private int no1;
    private int no2;
    private int no3;
    private int no4;
    private int no5;
    private int no6;
    private int bonusNo;
    private LocalDateTime createdAt;

    public int[] getNumbers() {
        return new int[]{no1, no2, no3, no4, no5, no6};
    }
}
