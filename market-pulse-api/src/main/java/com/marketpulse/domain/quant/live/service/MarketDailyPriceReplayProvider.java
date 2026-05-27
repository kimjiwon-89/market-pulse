package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.mapper.QuantBullV4ReplayFactMapper;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayFactVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MarketDailyPriceReplayProvider implements HistoricalReplayProvider {
    private static final BullV4ReplayConfig DEFAULT_CONFIG = BullV4ReplayConfig.BALANCED_PAPER;

    private final QuantBullV4ReplayFactMapper factMapper;

    @Override
    public List<ReplayTradeFact> bullV4ReplayFacts(LocalDate fromDate, LocalDate toDate) {
        return factMapper.findByConfigAndExitDateRange(DEFAULT_CONFIG.configKey(), fromDate, toDate)
                .stream()
                .map(this::toFact)
                .toList();
    }

    private ReplayTradeFact toFact(QuantBullV4ReplayFactVo fact) {
        return new ReplayTradeFact(
                fact.getEntryDate(),
                fact.getExitDate(),
                fact.getAssetCode(),
                fact.getAssetName(),
                fact.getEntryPrice(),
                fact.getExitPrice(),
                fact.getReturnPct(),
                fact.getScore(),
                DEFAULT_CONFIG.sourceLabel()
        );
    }
}
