package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MarketDailyPriceReplayProvider implements HistoricalReplayProvider {
    private static final int DAILY_LOOKBACK_DAYS = 5;

    private final MarketDailyPriceMapper priceMapper;

    @Override
    public List<ReplayTradeFact> bullV4ReplayFacts(LocalDate fromDate, LocalDate toDate) {
        return priceMapper.findDailyMomentumReplayPicks(fromDate, toDate, DAILY_LOOKBACK_DAYS, 1)
                .stream()
                .map(pick -> toFact(pick, "HISTORICAL_REPLAY_DAILY_MOMENTUM"))
                .toList();
    }

    private ReplayTradeFact toFact(MonthlyPickVo pick, String source) {
        BigDecimal returnPct = pick.getSellPrice()
                .subtract(pick.getBuyPrice())
                .divide(pick.getBuyPrice(), 8, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
        return new ReplayTradeFact(
                pick.getRebalanceDate(),
                pick.getExitDate(),
                pick.getAssetCode(),
                pick.getAssetName(),
                pick.getBuyPrice(),
                pick.getSellPrice(),
                returnPct,
                pick.getScore(),
                source
        );
    }
}
