package com.marketpulse.domain.lotto.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class LottoStatsDto {
    private final String strategy;
    private final String strategyName;
    private final double avgPoolHit;        // 누적 풀 평균 적중 개수
    private final double avgComboHit;       // 누적 조합 평균 적중 개수
    private final int totalDraws;           // 분석된 총 회차 수
    private final List<DrawHitDto> history; // 회차별 적중 기록

    @Getter
    @Builder
    public static class DrawHitDto {
        private final int drawNo;
        private final int poolHitCount;
        private final double avgComboHit;
    }
}
