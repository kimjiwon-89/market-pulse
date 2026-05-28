package com.marketpulse.domain.quant.model;

import java.time.LocalDate;

public interface QuantFeatureGenerator {
    String implementationKey();
    int generateFeatures(String modelCode, LocalDate fromDate, LocalDate toDate);
}
