package com.marketpulse.global.config;

import com.marketpulse.domain.index.service.IndexService;
import com.marketpulse.domain.investor.service.InvestorService;
import com.marketpulse.domain.investor.service.LeadingIndicatorCollectService;
import com.marketpulse.domain.news.service.NewsService;
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
public class RankingSnapshotScheduler {

    private final InvestorService investorService;
    private final LeadingIndicatorCollectService leadingIndicatorCollectService;
    private final IndexService indexService;
    private final NewsService newsService;

    /** 평일 장중 10분마다 — 전체 시장 데이터 수집 */
    @Scheduled(cron = "0 */10 9-15 * * MON-FRI")
    public void collectIntraday() {
        LocalDate today = LocalDate.now();
        log.info("=== Intraday collect start: {} ===", today);
        investorService.saveSnapshots(today);
        investorService.saveMarketFlowSnapshots(today);
        indexService.fetchAndSaveAll();
        log.info("=== Intraday collect done: {} ===", today);
    }

    /** 평일 15:35 — 장 마감 최종 스냅샷 */
    @Scheduled(cron = "0 35 15 * * MON-FRI")
    public void snapshotAtClose() {
        LocalDate today = LocalDate.now();
        log.info("=== Close snapshot start: {} ===", today);
        investorService.saveSnapshots(today);
        investorService.saveMarketFlowSnapshots(today);
        indexService.fetchAndSaveAll();
        log.info("=== Close snapshot done: {} ===", today);
    }

    /** 평일 16:05 — 선행 지표 수집 (공매도·ETF 레버리지/인버스) */
    @Scheduled(cron = "0 5 16 * * MON-FRI")
    public void collectLeadingIndicators() {
        LocalDate today = LocalDate.now();
        log.info("=== Leading indicator collect start: {} ===", today);
        leadingIndicatorCollectService.collect(today);
        log.info("=== Leading indicator collect done: {} ===", today);
    }

    /** 평일 9:00, 12:00, 15:00 — 뉴스 수집 */
    @Scheduled(cron = "0 0 9,12,15 * * MON-FRI")
    public void collectNews() {
        log.info("=== News collect start ===");
        newsService.fetchAndSave();
        log.info("=== News collect done ===");
    }
}
