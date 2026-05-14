package com.marketpulse.domain.lotto.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class LottoUserComboVo {
    private Long id;
    private int drawNo;
    private int[] numbers;
    private Integer hitCount;
    private LocalDateTime createdAt;
}
