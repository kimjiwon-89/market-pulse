package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.dto.AllocationDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class VolatilityAdjustStrategy extends AbstractQuantStrategy {
    public VolatilityAdjustStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "VOLATILITY_ADJUST";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MarketDailyPriceVo> series = priceMapper.findByCodeAndDateRange("KOSPI", "INDEX", fromDate, toDate);
        return simulateSingleAsset(strategy, fromDate, toDate, initialCash, series,
                "20일 변동성 기준 위험자산 비중 조절", "변동성 리밸런싱",
                List.of(
                        new AllocationDto("KOSPI", 0.7),
                        new AllocationDto("국채 3년", 0.3)
                ));
    }
}
