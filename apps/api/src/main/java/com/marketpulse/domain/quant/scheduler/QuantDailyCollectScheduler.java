package com.marketpulse.domain.quant.scheduler;

import com.marketpulse.domain.quant.service.QuantCollectService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class QuantDailyCollectScheduler {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private final QuantCollectService collectService;
    private final Clock clock;

    @Autowired
    public QuantDailyCollectScheduler(QuantCollectService collectService) {
        this(collectService, Clock.system(KST));
    }

    QuantDailyCollectScheduler(QuantCollectService collectService, Clock clock) {
        this.collectService = collectService;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 16 * * MON-FRI")
    public void dailyCollect() {
        LocalDate target = LocalDate.now(clock.withZone(KST));
        String date = target.format(BASIC);
        log.info("Quant daily collect start: {}", date);
        collectService.collect(date, date, "ALL");
    }

    @Scheduled(cron = "0 10 16 * * MON-FRI")
    public void dailyEtfCollect() {
        LocalDate target = LocalDate.now(clock.withZone(KST));
        String date = target.format(BASIC);
        log.info("Quant ETF daily collect start: {}", date);
        collectService.collect(date, date, "ETF");
    }

    @Scheduled(cron = "0 15 16 * * MON-FRI")
    public void dailyEtnCollect() {
        LocalDate target = LocalDate.now(clock.withZone(KST));
        String date = target.format(BASIC);
        log.info("Quant ETN daily collect start: {}", date);
        collectService.collect(date, date, "ETN");
    }
}
