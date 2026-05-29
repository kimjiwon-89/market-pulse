package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;

public enum BullV4ReplayConfig {
    BALANCED_PAPER(
            "BULL_V4",
            "5.0.1",
            "BULL_V4_5_0_1_100M_BALANCED_PAPER",
            "BULL_V4_5_0_1_100M_REPLAY_BALANCED_PAPER",
            new BigDecimal("10000000")
    );

    private final String modelCode;
    private final String modelVersion;
    private final String configKey;
    private final String sourceLabel;
    private final BigDecimal positionCash;

    BullV4ReplayConfig(String modelCode, String modelVersion, String configKey, String sourceLabel, BigDecimal positionCash) {
        this.modelCode = modelCode;
        this.modelVersion = modelVersion;
        this.configKey = configKey;
        this.sourceLabel = sourceLabel;
        this.positionCash = positionCash;
    }

    public String modelCode() {
        return modelCode;
    }

    public String modelVersion() {
        return modelVersion;
    }

    public String configKey() {
        return configKey;
    }

    public String sourceLabel() {
        return sourceLabel;
    }

    public BigDecimal positionCash() {
        return positionCash;
    }
}
