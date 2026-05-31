package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class LiveQuantRuntimeRegistry {
    private final Map<String, LiveQuantModelRuntime> runtimes;

    public LiveQuantRuntimeRegistry(List<LiveQuantModelRuntime> runtimes) {
        LinkedHashMap<String, LiveQuantModelRuntime> ordered = new LinkedHashMap<>();
        for (LiveQuantModelRuntime runtime : runtimes) {
            ordered.put(runtime.modelCode(), runtime);
        }
        this.runtimes = Collections.unmodifiableMap(ordered);
    }

    public List<LiveQuantModelSummaryDto> visibleSummaries() {
        return runtimes.values().stream()
                .filter(LiveQuantModelRuntime::visible)
                .map(LiveQuantModelRuntime::summary)
                .toList();
    }

    public LiveQuantModelRuntime require(String modelCode) {
        LiveQuantModelRuntime runtime = runtimes.get(modelCode);
        if (runtime == null) {
            throw new IllegalArgumentException("Unknown live quant model: " + modelCode);
        }
        return runtime;
    }
}
