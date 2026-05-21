package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ShortTermReversalStrategy extends AbstractQuantStrategy {
    public ShortTermReversalStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "SHORT_TERM_REVERSAL";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findWeeklyShortTermReversalPicks(
                fromDate,
                toDate,
                5,
                10,
                100_000_000_000L,
                100_000L
        );
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "Short-term reversal: oversold liquid stock basket",
                "Weekly reversal exit");
    }
}
