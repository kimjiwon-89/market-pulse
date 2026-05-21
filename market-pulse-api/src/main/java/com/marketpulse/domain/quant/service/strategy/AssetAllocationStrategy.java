package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.dto.AllocationDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class AssetAllocationStrategy extends AbstractQuantStrategy {
    public AssetAllocationStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "ASSET_ALLOCATION";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MarketDailyPriceVo> series = priceMapper.findByCodeAndDateRange("KOSPI", "INDEX", fromDate, toDate);
        return simulateSingleAsset(strategy, fromDate, toDate, initialCash, series,
                "주식 60 / 채권 30 / 금 10 목표 비중", "분기 리밸런싱",
                List.of(
                        new AllocationDto("KOSPI", 0.6),
                        new AllocationDto("국채 3년", 0.3),
                        new AllocationDto("금", 0.1)
                ));
    }
}
