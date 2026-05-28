package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MomentumStrategy extends AbstractQuantStrategy {
    public MomentumStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "MOMENTUM";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findMonthlyMomentumPicks(fromDate, toDate, 21, 20);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "직전 기간 수익률 상위 종목 편입", "월말 리밸런싱");
    }
}
