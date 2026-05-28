package com.marketpulse.domain.quant.live.scheduler;

import com.marketpulse.domain.quant.live.dto.BullV4ReplayPrecomputeResultDto;
import com.marketpulse.domain.quant.live.service.BullV4ReplayPrecomputeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class BullV4ReplayPrecomputeScheduler {
    private final BullV4ReplayPrecomputeService precomputeService;

    @Scheduled(cron = "0 30 16 * * MON-FRI")
    public void dailyPrecompute() {
        LocalDate targetDate = LocalDate.now();
        log.info("Bull V4 replay precompute start: {}", targetDate);
        BullV4ReplayPrecomputeResultDto result = precomputeService.precomputeDaily(targetDate);
        log.info("Bull V4 replay precompute done: config={}, from={}, to={}, deleted={}, inserted={}",
                result.configKey(), result.fromDate(), result.toDate(), result.deletedCount(), result.insertedCount());
    }
}
