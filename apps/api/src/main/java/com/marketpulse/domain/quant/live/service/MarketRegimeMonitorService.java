package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.index.mapper.IndexMapper;
import com.marketpulse.domain.index.vo.IndexSnapshotVo;
import com.marketpulse.domain.quant.mapper.QuantMarketRegimeSnapshotMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class MarketRegimeMonitorService {
    private static final String KOSPI_INDEX_CODE = "0001";
    private static final String KOSDAQ_INDEX_CODE = "1001";

    private final MarketRegimeFeatureProvider featureProvider;
    private final IndexMapper indexMapper;
    private final QuantMarketRegimeSnapshotMapper snapshotMapper;
    private final MarketRegimeEngine engine;

    public MarketRegimeSnapshot latest() {
        MarketRegimeSnapshot latest = snapshotMapper.findLatest();
        if (latest != null) {
            return latest;
        }
        return refresh(featureProvider.latestCompletedTradeDate(), LocalDate.now());
    }

    public MarketRegimeSnapshot refreshLatest() {
        return refresh(featureProvider.latestCompletedTradeDate(), LocalDate.now());
    }

    public MarketRegimeSnapshot refresh(LocalDate cacheDate, LocalDate tradeDate) {
        MarketRegimeFeatures features = featureProvider.load(cacheDate);
        BigDecimal liveKospi = latestIndexPrice(KOSPI_INDEX_CODE);
        BigDecimal liveKosdaq = latestIndexPrice(KOSDAQ_INDEX_CODE);
        MarketRegimeSnapshot snapshot = engine.classify(features, liveKospi, liveKosdaq, tradeDate);
        snapshotMapper.upsert(snapshot);
        return snapshot;
    }

    private BigDecimal latestIndexPrice(String indexCode) {
        IndexSnapshotVo snapshot = indexMapper.findLatest(indexCode);
        if (snapshot == null || snapshot.getCurrentPrice() == null || snapshot.getCurrentPrice().isBlank()) {
            throw new IllegalStateException("Latest index snapshot is missing for indexCode=" + indexCode);
        }
        return new BigDecimal(snapshot.getCurrentPrice().replace(",", "").trim());
    }
}
