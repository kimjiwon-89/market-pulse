package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DualMomentumStrategy extends AbstractQuantStrategy {
    public DualMomentumStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "DUAL_MOMENTUM";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findMonthlyDualMomentumPicks(fromDate, toDate, 126);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "Dual momentum: best positive 6M relative momentum asset, otherwise defensive asset",
                "Monthly dual momentum rebalance");
    }
}
