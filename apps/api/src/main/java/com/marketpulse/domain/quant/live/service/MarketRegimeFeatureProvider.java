package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class MarketRegimeFeatureProvider {
    private static final int DEFAULT_BREADTH_LIMIT = 500;

    private final MarketDailyPriceMapper priceMapper;

    public LocalDate latestCompletedTradeDate() {
        LocalDate date = priceMapper.findLatestIndexTradeDate();
        if (date == null) {
            throw new IllegalStateException("KOSPI/KOSDAQ index history is missing.");
        }
        return date;
    }

    public MarketRegimeFeatures load(LocalDate cacheDate) {
        MarketRegimeFeatureRow row = priceMapper.findMarketRegimeFeatures(
                cacheDate,
                cacheDate.minusDays(140),
                DEFAULT_BREADTH_LIMIT
        );
        if (row == null || row.getKospiMa20() == null || row.getKosdaqMa20() == null) {
            throw new IllegalStateException("Market regime features are incomplete for cacheDate=" + cacheDate);
        }
        return row.toFeatures();
    }
}
