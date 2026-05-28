package com.marketpulse.domain.quant.runner;

import com.marketpulse.domain.quant.service.QuantModelDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
@RequiredArgsConstructor
public class QuantModelInitRunner implements CommandLineRunner {
    private final QuantModelDefinitionService modelDefinitionService;

    @Override
    public void run(String... args) {
        modelDefinitionService.seedCodeModels();
    }
}
