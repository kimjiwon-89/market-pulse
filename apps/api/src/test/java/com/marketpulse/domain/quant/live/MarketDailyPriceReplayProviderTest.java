package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.quant.live.service.MarketDailyPriceReplayProvider;
import com.marketpulse.domain.quant.live.service.ReplayTradeFact;
import com.marketpulse.domain.quant.mapper.QuantBullV4ReplayFactMapper;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayFactVo;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketDailyPriceReplayProviderTest {

    @Test
    void bullV4ReplayUsesDedicatedFrozenRuleMapper() {
        QuantBullV4ReplayFactMapper mapper = mock(QuantBullV4ReplayFactMapper.class);
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 27);
        when(mapper.findByConfigAndExitDateRange("BULL_V4_5_0_0_BALANCED_PAPER", from, to)).thenReturn(List.of(fact()));

        List<ReplayTradeFact> facts = new MarketDailyPriceReplayProvider(mapper).bullV4ReplayFacts(from, to);

        verify(mapper).findByConfigAndExitDateRange("BULL_V4_5_0_0_BALANCED_PAPER", from, to);
        assertThat(facts).hasSize(1);
        assertThat(facts.get(0).source()).isEqualTo("BULL_V4_5_0_0_REPLAY_BALANCED_PAPER");
        assertThat(facts.get(0).returnPct()).isEqualByComparingTo("10.00");
    }

    private QuantBullV4ReplayFactVo fact() {
        QuantBullV4ReplayFactVo fact = new QuantBullV4ReplayFactVo();
        fact.setEntryDate(LocalDate.of(2026, 5, 8));
        fact.setExitDate(LocalDate.of(2026, 5, 20));
        fact.setAssetCode("111111");
        fact.setAssetName("Replay Alpha");
        fact.setEntryPrice(new BigDecimal("10000"));
        fact.setExitPrice(new BigDecimal("11000"));
        fact.setReturnPct(new BigDecimal("10.00"));
        fact.setScore(new BigDecimal("0.91"));
        return fact;
    }
}
