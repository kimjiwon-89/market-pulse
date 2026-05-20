package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class SectorRotationStrategy extends AbstractQuantStrategy {
    public SectorRotationStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "SECTOR_ROTATION";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findMonthlySectorPicks(fromDate, toDate, 21, 3, 5);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, picks,
                "상위 섹터 대표 종목 편입", "섹터 로테이션 종료");
    }
}
