package com.marketpulse.domain.quant.model;

import java.util.Map;

public interface QuantModelDefinition {
    String modelCode();
    String displayName();
    String description();
    String modelType();
    String implementationKey();
    Map<String, Object> configSchema();
    Map<String, Object> defaultConfig();
}
