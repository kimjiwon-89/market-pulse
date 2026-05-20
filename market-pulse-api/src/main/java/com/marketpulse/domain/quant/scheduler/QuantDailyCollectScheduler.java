package com.marketpulse.domain.quant.scheduler;

import com.marketpulse.domain.quant.service.QuantCollectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuantDailyCollectScheduler {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private final QuantCollectService collectService;

    @Scheduled(cron = "0 0 16 * * MON-FRI")
    public void dailyCollect() {
        LocalDate target = LocalDate.now().minusDays(1);
        String date = target.format(BASIC);
        log.info("Quant daily collect start: {}", date);
        collectService.collect(date, date, "ALL");
    }
}
