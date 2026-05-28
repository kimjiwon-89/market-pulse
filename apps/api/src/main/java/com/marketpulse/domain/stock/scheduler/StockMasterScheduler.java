package com.marketpulse.domain.stock.scheduler;

import com.marketpulse.domain.stock.service.StockMasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class StockMasterScheduler {

    private final StockMasterService stockMasterService;

    /** 매일 자정 — KRX 전종목 기본정보 갱신 (어제 날짜 기준) */
    @Scheduled(cron = "0 0 0 * * *")
    public void updateStockMaster() {
        log.info("=== StockMaster update start ===");
        try {
            stockMasterService.updateAll();
        } catch (Exception e) {
            log.error("StockMaster update failed: {}", e.getMessage(), e);
        }
        log.info("=== StockMaster update done ===");
    }
}
