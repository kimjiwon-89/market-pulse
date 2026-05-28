package com.marketpulse.domain.quant.model.mp_core;

import com.marketpulse.domain.quant.model.QuantModelDefinition;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MpCoreModelDefinition implements QuantModelDefinition {
    @Override
    public String modelCode() {
        return "MP_CORE";
    }

    @Override
    public String displayName() {
        return "Market Pulse Core Quant Model";
    }

    @Override
    public String description() {
        return "가격, 유동성, 변동성, 베타, 섹터, 수급 피처를 이용해 WINNER/NEUTRAL/LOSER 확률과 목표 비중을 산출하는 코어 모델";
    }

    @Override
    public String modelType() {
        return "CLASSIFICATION";
    }

    @Override
    public String implementationKey() {
        return "mp_core";
    }

    @Override
    public Map<String, Object> configSchema() {
        return Map.of(
                "targetMonthlyReturn", Map.of("type", "number", "default", 0.05, "guarantee", false),
                "labelHorizonDays", Map.of("type", "integer", "default", 20),
                "winnerReturnThreshold", Map.of("type", "number", "default", 0.08),
                "winnerExcessThreshold", Map.of("type", "number", "default", 0.03),
                "loserReturnThreshold", Map.of("type", "number", "default", -0.05),
                "winnerProbThreshold", Map.of("type", "number", "default", 0.55),
                "maxStockWeight", Map.of("type", "number", "default", 0.15),
                "maxSectorWeight", Map.of("type", "number", "default", 0.35),
                "maxKosdaqWeight", Map.of("type", "number", "default", 0.50),
                "featureGroups", List.of("momentum", "risk", "liquidity", "sector", "flow")
        );
    }

    @Override
    public Map<String, Object> defaultConfig() {
        return Map.ofEntries(
                Map.entry("targetMonthlyReturn", 0.05),
                Map.entry("targetIsGuarantee", false),
                Map.entry("labelHorizonDays", 20),
                Map.entry("winnerReturnThreshold", 0.08),
                Map.entry("winnerExcessThreshold", 0.03),
                Map.entry("loserReturnThreshold", -0.05),
                Map.entry("winnerProbThreshold", 0.55),
                Map.entry("maxStockWeight", 0.15),
                Map.entry("maxSectorWeight", 0.35),
                Map.entry("maxKosdaqWeight", 0.50),
                Map.entry("rebalanceCycle", "WEEKLY")
        );
    }
}
