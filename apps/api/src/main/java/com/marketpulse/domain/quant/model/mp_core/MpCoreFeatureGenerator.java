package com.marketpulse.domain.quant.model.mp_core;

import com.marketpulse.domain.quant.mapper.QuantCoreFeatureSnapshotMapper;
import com.marketpulse.domain.quant.model.QuantFeatureGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class MpCoreFeatureGenerator implements QuantFeatureGenerator {
    private final QuantCoreFeatureSnapshotMapper featureMapper;

    @Override
    public String implementationKey() {
        return "mp_core";
    }

    @Override
    public int generateFeatures(String modelCode, LocalDate fromDate, LocalDate toDate) {
        return featureMapper.generateMpCoreFeatures(modelCode, fromDate, toDate);
    }
}
