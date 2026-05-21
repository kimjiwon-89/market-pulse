package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MpCoreSignalStrategy extends AbstractQuantStrategy {
    public MpCoreSignalStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "MP_CORE_SIGNAL";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findMonthlyMpCoreSignalPicks(fromDate, toDate, 10);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "MP_CORE feature score top basket",
                "Monthly MP_CORE rebalance");
    }
}
