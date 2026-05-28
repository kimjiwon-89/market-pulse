package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class CandlePullbackStrategy extends AbstractQuantStrategy {
    private static final int TOP_N = 10;

    public CandlePullbackStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "CANDLE_PULLBACK_V1";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findMonthlyCandlePullbackPicks(fromDate, toDate, TOP_N);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "Candle pullback: uptrend, controlled drawdown, rebound candle",
                "Monthly candle pullback exit");
    }
}
