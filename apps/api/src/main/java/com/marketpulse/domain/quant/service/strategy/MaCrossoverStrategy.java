package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MaCrossoverStrategy extends AbstractQuantStrategy {
    public MaCrossoverStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "MA_CROSSOVER";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MarketDailyPriceVo> series = priceMapper.findByCodeAndDateRange("KOSPI", "INDEX", fromDate, toDate);
        return simulateSingleAsset(strategy, fromDate, toDate, initialCash, series,
                "20일/60일 이동평균 돌파 신호", "기간 종료 리밸런싱", List.of());
    }
}
