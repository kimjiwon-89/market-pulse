package com.marketpulse.global.config;

import com.marketpulse.domain.investor.service.InvestorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class RankingSnapshotScheduler {

    private final InvestorService investorService;

    /** 매 평일 15:35 — 장 마감 후 외국인 순매수 랭킹 스냅샷 저장 */
    @Scheduled(cron = "0 35 15 * * MON-FRI")
    public void snapshotAtClose() {
        LocalDate today = LocalDate.now();
        log.info("=== Ranking snapshot scheduled start: {} ===", today);
        investorService.saveSnapshots(today);
        log.info("=== Ranking snapshot scheduled done: {} ===", today);
    }
}
