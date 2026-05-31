package com.marketpulse.domain.quant.live.scheduler;

import com.marketpulse.domain.quant.live.service.LiveQuantPaperTradingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "market-pulse.quant.live-paper.scheduler.enabled", havingValue = "true")
@RequiredArgsConstructor
public class LiveQuantPaperTradingScheduler {
    private final LiveQuantPaperTradingService paperTradingService;

    @Scheduled(cron = "45 */10 9-15 * * MON-FRI", zone = "Asia/Seoul")
    public void runIntradayPaperTrading() {
        LiveQuantPaperTradingService.RunResult result = paperTradingService.runOnce();
        log.info("Live quant paper trading run completed: {}", result);
    }
}
