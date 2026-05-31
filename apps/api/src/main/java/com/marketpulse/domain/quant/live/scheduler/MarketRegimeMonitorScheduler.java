package com.marketpulse.domain.quant.live.scheduler;

import com.marketpulse.domain.quant.live.service.MarketRegimeMonitorService;
import com.marketpulse.domain.quant.live.service.MarketRegimeSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class MarketRegimeMonitorScheduler {
    private final MarketRegimeMonitorService monitorService;

    @Scheduled(cron = "30 */10 9-15 * * MON-FRI")
    public void refreshIntradayRegime() {
        MarketRegimeSnapshot snapshot = monitorService.refreshLatest();
        log.info("Market regime refreshed: tradeDate={}, cacheDate={}, kospi={}, kosdaq={}, combined={}, strategy={}",
                snapshot.tradeDate(),
                snapshot.cacheDate(),
                snapshot.kospiRegime(),
                snapshot.kosdaqRegime(),
                snapshot.combinedRegime(),
                snapshot.allowedStrategy());
    }
}
