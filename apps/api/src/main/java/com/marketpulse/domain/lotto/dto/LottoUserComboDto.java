package com.marketpulse.domain.lotto.dto;

import com.marketpulse.domain.lotto.vo.LottoUserComboVo;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class LottoUserComboDto {
    private final Long id;
    private final int drawNo;
    private final List<Integer> numbers;
    private final Integer hitCount;
    private final LocalDateTime createdAt;

    public LottoUserComboDto(LottoUserComboVo vo) {
        this.id        = vo.getId();
        this.drawNo    = vo.getDrawNo();
        this.numbers   = Arrays.stream(vo.getNumbers()).boxed().collect(Collectors.toList());
        this.hitCount  = vo.getHitCount();
        this.createdAt = vo.getCreatedAt();
    }
}
