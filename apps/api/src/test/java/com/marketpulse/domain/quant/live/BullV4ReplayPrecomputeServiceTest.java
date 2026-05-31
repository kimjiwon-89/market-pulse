package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.quant.live.dto.BullV4ReplayCacheStatusDto;
import com.marketpulse.domain.quant.live.dto.BullV4ReplayPrecomputeResultDto;
import com.marketpulse.domain.quant.live.service.BullV4ReplayPrecomputeService;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.mapper.QuantBullV4ReplayFactMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayCacheStatusVo;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayFactVo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BullV4ReplayPrecomputeServiceTest {

    @Test
    void precomputeDailyRefreshesLast120DaysIntoCache() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        QuantBullV4ReplayFactMapper factMapper = mock(QuantBullV4ReplayFactMapper.class);
        LocalDate targetDate = LocalDate.of(2026, 5, 27);
        LocalDate fromDate = LocalDate.of(2026, 1, 27);
        when(priceMapper.findBullV4PaperReplayPicks(fromDate, targetDate)).thenReturn(List.of(pick()));
        when(factMapper.upsertBatch(anyList())).thenReturn(1);

        BullV4ReplayPrecomputeResultDto result = new BullV4ReplayPrecomputeService(priceMapper, factMapper)
                .precomputeDaily(targetDate);

        verify(factMapper).deleteByConfigAndExitDateRange("BULL_V4_5_0_1_100M_BALANCED_PAPER", fromDate, targetDate);
        verify(priceMapper).findBullV4PaperReplayPicks(fromDate, targetDate);
        ArgumentCaptor<List<QuantBullV4ReplayFactVo>> captor = ArgumentCaptor.forClass(List.class);
        verify(factMapper).upsertBatch(captor.capture());
        assertThat(result.insertedCount()).isEqualTo(1);
        assertThat(result.modelVersion()).isEqualTo("5.0.1");
        assertThat(captor.getValue()).singleElement().satisfies(fact -> {
            assertThat(fact.getConfigKey()).isEqualTo("BULL_V4_5_0_1_100M_BALANCED_PAPER");
            assertThat(fact.getPositionCash()).isEqualByComparingTo("10000000");
            assertThat(fact.getPnlKrw()).isEqualByComparingTo("1000000");
            assertThat(fact.getReturnPct()).isEqualByComparingTo("10.000000");
        });
    }

    @Test
    void cacheStatusIsReadyOnlyWhenRowsExist() {
        MarketDailyPriceMapper priceMapper = mock(MarketDailyPriceMapper.class);
        QuantBullV4ReplayFactMapper factMapper = mock(QuantBullV4ReplayFactMapper.class);
        QuantBullV4ReplayCacheStatusVo status = new QuantBullV4ReplayCacheStatusVo();
        status.setConfigKey("BULL_V4_5_0_1_100M_BALANCED_PAPER");
        status.setCachedRows(3L);
        status.setFirstExitDate(LocalDate.of(2025, 10, 10));
        status.setLatestExitDate(LocalDate.of(2025, 11, 25));
        status.setLatestUpdatedAt(LocalDateTime.of(2026, 5, 27, 16, 30));
        when(factMapper.findCacheStatus("BULL_V4_5_0_1_100M_BALANCED_PAPER")).thenReturn(status);

        BullV4ReplayCacheStatusDto dto = new BullV4ReplayPrecomputeService(priceMapper, factMapper).cacheStatus();

        assertThat(dto.ready()).isTrue();
        assertThat(dto.modelVersion()).isEqualTo("5.0.1");
        assertThat(dto.cachedRows()).isEqualTo(3);
        assertThat(dto.latestExitDate()).isEqualTo(LocalDate.of(2025, 11, 25));
    }

    private MonthlyPickVo pick() {
        MonthlyPickVo pick = new MonthlyPickVo();
        pick.setRebalanceDate(LocalDate.of(2026, 5, 8));
        pick.setExitDate(LocalDate.of(2026, 5, 20));
        pick.setAssetCode("111111");
        pick.setAssetName("Replay Alpha");
        pick.setBuyPrice(new BigDecimal("10000"));
        pick.setSellPrice(new BigDecimal("11000"));
        pick.setScore(new BigDecimal("0.91"));
        return pick;
    }
}
