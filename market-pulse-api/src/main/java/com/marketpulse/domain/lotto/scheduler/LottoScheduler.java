package com.marketpulse.domain.lotto.scheduler;

import com.marketpulse.domain.lotto.service.DhlotteryClient;
import com.marketpulse.domain.lotto.service.LottoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LottoScheduler {

    private final LottoService lottoService;
    private final DhlotteryClient dhlotteryClient;

    /** 매주 토요일 21:30 — 당첨 번호 수집 + 분석 실행 */
    @Scheduled(cron = "0 30 21 * * SAT")
    public void weeklyCollect() {
        log.info("lotto weekly collect start");
        int latest = dhlotteryClient.findLatestDrawNo();
        lottoService.collectAndAnalyze(latest);
    }
}
