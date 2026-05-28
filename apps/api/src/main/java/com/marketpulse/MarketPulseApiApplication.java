package com.marketpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MarketPulseApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketPulseApiApplication.class, args);
    }
}
