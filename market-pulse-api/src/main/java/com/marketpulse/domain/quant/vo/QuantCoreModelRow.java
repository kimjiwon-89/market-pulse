package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class QuantCoreModelRow {
    private String modelCode;
    private String modelName;
    private String activeVersion;
    private String algorithm;
    private LocalDate trainFrom;
    private LocalDate trainTo;
}
