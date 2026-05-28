package com.marketpulse.domain.quant.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class QuantExperimentGridFactory {

    public List<Map<String, Object>> create(String strategyNameEn, int maxVariants) {
        List<Map<String, Object>> variants = switch (strategyNameEn) {
            case "DUAL_MOMENTUM" -> dualMomentum();
            case "SHORT_TERM_REVERSAL" -> shortTermReversal();
            case "MOMENTUM" -> momentum();
            case "SECTOR_ROTATION" -> sectorRotation();
            default -> List.of(defaultParams());
        };
        return variants.stream().limit(Math.max(1, maxVariants)).toList();
    }

    private List<Map<String, Object>> dualMomentum() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int lookbackDays : List.of(63, 126, 252)) {
            for (String defensive : List.of("CASH", "KTB3Y", "GOLD")) {
                for (Object volatilityTarget : List.of(0.10, 0.15, "OFF")) {
                    for (boolean regimeFilter : List.of(true, false)) {
                        items.add(map(
                                "lookbackDays", lookbackDays,
                                "riskAssets", List.of("KOSPI", "KOSDAQ", "GOLD"),
                                "defensive", defensive,
                                "regimeFilter", regimeFilter,
                                "volatilityTarget", volatilityTarget
                        ));
                    }
                }
            }
        }
        return items;
    }

    private List<Map<String, Object>> shortTermReversal() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int lookbackDays : List.of(3, 5, 10)) {
            for (int topN : List.of(5, 10, 20)) {
                for (double stopLossPct : List.of(0.03, 0.05, 0.08)) {
                    for (double takeProfitPct : List.of(0.05, 0.08, 0.12)) {
                        for (boolean marketCrashFilter : List.of(true, false)) {
                            items.add(map(
                                    "lookbackDays", lookbackDays,
                                    "topN", topN,
                                    "stopLossPct", stopLossPct,
                                    "takeProfitPct", takeProfitPct,
                                    "marketCrashFilter", marketCrashFilter
                            ));
                        }
                    }
                }
            }
        }
        return items;
    }

    private List<Map<String, Object>> momentum() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int lookbackDays : List.of(21, 63, 126)) {
            for (int topN : List.of(10, 20, 30)) {
                for (String rebalanceCycle : List.of("MONTHLY", "BIWEEKLY")) {
                    for (Object volatilityTarget : List.of(0.15, "OFF")) {
                        items.add(map(
                                "lookbackDays", lookbackDays,
                                "topN", topN,
                                "rebalanceCycle", rebalanceCycle,
                                "liquidityFilter", true,
                                "volatilityTarget", volatilityTarget
                        ));
                    }
                }
            }
        }
        return items;
    }

    private List<Map<String, Object>> sectorRotation() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int lookbackDays : List.of(21, 63, 126)) {
            for (int topSectors : List.of(2, 3, 4)) {
                for (int topStocksPerSector : List.of(3, 5)) {
                    for (boolean sectorBreadthFilter : List.of(true, false)) {
                        items.add(map(
                                "lookbackDays", lookbackDays,
                                "topSectors", topSectors,
                                "topStocksPerSector", topStocksPerSector,
                                "sectorBreadthFilter", sectorBreadthFilter,
                                "cashWhenNoSector", true
                        ));
                    }
                }
            }
        }
        return items;
    }

    private Map<String, Object> defaultParams() {
        return map("default", true);
    }

    private Map<String, Object> map(Object... keyValues) {
        Map<String, Object> value = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            value.put(String.valueOf(keyValues[i]), keyValues[i + 1]);
        }
        return value;
    }
}
