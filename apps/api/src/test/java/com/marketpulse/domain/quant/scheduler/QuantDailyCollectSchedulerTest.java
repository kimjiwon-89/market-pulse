package com.marketpulse.domain.quant.scheduler;

import com.marketpulse.domain.quant.service.QuantCollectService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class QuantDailyCollectSchedulerTest {
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-02T07:00:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    @Test
    void dailyStockCollectUsesCurrentTradingDateAfterMarketClose() {
        QuantCollectService collectService = mock(QuantCollectService.class);
        QuantDailyCollectScheduler scheduler = new QuantDailyCollectScheduler(collectService, CLOCK);

        scheduler.dailyCollect();

        verify(collectService).collect("20260602", "20260602", "ALL");
    }

    @Test
    void dailyEtfAndEtnCollectUseCurrentTradingDateAfterMarketClose() {
        QuantCollectService collectService = mock(QuantCollectService.class);
        QuantDailyCollectScheduler scheduler = new QuantDailyCollectScheduler(collectService, CLOCK);

        scheduler.dailyEtfCollect();
        scheduler.dailyEtnCollect();

        verify(collectService).collect("20260602", "20260602", "ETF");
        verify(collectService).collect("20260602", "20260602", "ETN");
    }
}
