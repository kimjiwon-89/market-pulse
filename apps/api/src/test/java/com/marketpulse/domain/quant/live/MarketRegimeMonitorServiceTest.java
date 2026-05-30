package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.index.mapper.IndexMapper;
import com.marketpulse.domain.index.vo.IndexSnapshotVo;
import com.marketpulse.domain.quant.live.service.MarketRegimeEngine;
import com.marketpulse.domain.quant.live.service.MarketRegimeFeatureProvider;
import com.marketpulse.domain.quant.live.service.MarketRegimeFeatures;
import com.marketpulse.domain.quant.live.service.MarketRegimeMonitorService;
import com.marketpulse.domain.quant.live.service.MarketRegimeSnapshot;
import com.marketpulse.domain.quant.mapper.QuantMarketRegimeSnapshotMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketRegimeMonitorServiceTest {

    @Test
    void refreshUsesLatestIndexSnapshotsAndPersistsRegimeSnapshot() {
        MarketRegimeFeatureProvider featureProvider = mock(MarketRegimeFeatureProvider.class);
        IndexMapper indexMapper = mock(IndexMapper.class);
        QuantMarketRegimeSnapshotMapper snapshotMapper = mock(QuantMarketRegimeSnapshotMapper.class);
        MarketRegimeMonitorService service = new MarketRegimeMonitorService(
                featureProvider,
                indexMapper,
                snapshotMapper,
                new MarketRegimeEngine()
        );

        LocalDate cacheDate = LocalDate.of(2026, 5, 29);
        when(featureProvider.load(cacheDate)).thenReturn(bullFeatures(cacheDate));
        when(indexMapper.findLatest("0001")).thenReturn(index("0001", "2700.25"));
        when(indexMapper.findLatest("1001")).thenReturn(index("1001", "860.10"));

        MarketRegimeSnapshot snapshot = service.refresh(cacheDate, LocalDate.of(2026, 5, 30));

        assertThat(snapshot.combinedRegime()).isEqualTo("BULL");
        assertThat(snapshot.kospiAllowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.kosdaqAllowedStrategy()).isEqualTo("W4_BREAKOUT");
        assertThat(snapshot.liveKospi()).isEqualByComparingTo("2700.25");
        assertThat(snapshot.liveKosdaq()).isEqualByComparingTo("860.10");
        verify(snapshotMapper).upsert(snapshot);
    }

    @Test
    void latestFallsBackToFreshRefreshWhenNoSnapshotExists() {
        MarketRegimeFeatureProvider featureProvider = mock(MarketRegimeFeatureProvider.class);
        IndexMapper indexMapper = mock(IndexMapper.class);
        QuantMarketRegimeSnapshotMapper snapshotMapper = mock(QuantMarketRegimeSnapshotMapper.class);
        MarketRegimeMonitorService service = new MarketRegimeMonitorService(
                featureProvider,
                indexMapper,
                snapshotMapper,
                new MarketRegimeEngine()
        );

        when(snapshotMapper.findLatest()).thenReturn(null);
        when(featureProvider.latestCompletedTradeDate()).thenReturn(LocalDate.of(2026, 5, 29));
        when(featureProvider.load(LocalDate.of(2026, 5, 29))).thenReturn(bullFeatures(LocalDate.of(2026, 5, 29)));
        when(indexMapper.findLatest("0001")).thenReturn(index("0001", "2700.25"));
        when(indexMapper.findLatest("1001")).thenReturn(index("1001", "860.10"));

        MarketRegimeSnapshot snapshot = service.latest();

        assertThat(snapshot.tradeDate()).isEqualTo(LocalDate.now());
        assertThat(snapshot.combinedRegime()).isEqualTo("BULL");
        verify(snapshotMapper).upsert(snapshot);
    }

    private IndexSnapshotVo index(String code, String currentPrice) {
        IndexSnapshotVo vo = new IndexSnapshotVo();
        vo.setSnapDate(LocalDate.of(2026, 5, 30));
        vo.setIndexCode(code);
        vo.setCurrentPrice(currentPrice);
        return vo;
    }

    private MarketRegimeFeatures bullFeatures(LocalDate tradeDate) {
        return new MarketRegimeFeatures(
                tradeDate,
                new BigDecimal("2450"),
                new BigDecimal("2380"),
                new BigDecimal("0.008"),
                new BigDecimal("0.015"),
                new BigDecimal("775"),
                new BigDecimal("740"),
                new BigDecimal("0.006"),
                new BigDecimal("0.018"),
                new BigDecimal("0.62"),
                new BigDecimal("0.55"),
                new BigDecimal("0.58"),
                new BigDecimal("0.06")
        );
    }
}
