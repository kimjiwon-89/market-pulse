package com.marketpulse.domain.quant.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class QuantModelDefinitionVo {
    private Long id;
    private String modelCode;
    private String displayName;
    private String description;
    private String modelType;
    private String implementationType;
    private String implementationKey;
    private String configSchema;
    private String defaultConfig;
    private Boolean isUserDefined;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
