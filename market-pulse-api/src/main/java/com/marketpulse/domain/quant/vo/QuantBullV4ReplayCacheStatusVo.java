package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class QuantBullV4ReplayCacheStatusVo {
    private String configKey;
    private Long cachedRows;
    private LocalDate firstExitDate;
    private LocalDate latestExitDate;
    private LocalDateTime latestUpdatedAt;
}
