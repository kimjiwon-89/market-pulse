package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class CandleMtfTrendStrategy extends AbstractQuantStrategy {
    private static final int TOP_N = 1;
    private static final int MAX_HOLD_DAYS = 40;

    public CandleMtfTrendStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "CANDLE_MTF_TREND_V2";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findEventDrivenCandleMtfTrendPicks(fromDate, toDate, TOP_N, MAX_HOLD_DAYS);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, filterNonOverlappingPicks(picks),
                "MTF trend entry: monthly/weekly/daily candle alignment, minute gate NO_MINUTE_DATA fallback",
                "MTF trend exit: early weakness defense, 10-day checkpoint exits, and trend exhaustion exits");
    }

    private List<MonthlyPickVo> filterNonOverlappingPicks(List<MonthlyPickVo> picks) {
        if (picks == null || picks.isEmpty()) {
            return List.of();
        }

        List<MonthlyPickVo> ordered = picks.stream()
                .filter(pick -> pick.getRebalanceDate() != null && pick.getExitDate() != null)
                .sorted(Comparator.comparing(MonthlyPickVo::getRebalanceDate)
                        .thenComparing(pick -> pick.getPickRank() == null ? Integer.MAX_VALUE : pick.getPickRank()))
                .toList();

        List<MonthlyPickVo> selected = new ArrayList<>();
        LocalDate lastExitDate = null;
        for (MonthlyPickVo pick : ordered) {
            if (lastExitDate != null && !pick.getRebalanceDate().isAfter(lastExitDate)) {
                continue;
            }
            selected.add(pick);
            lastExitDate = pick.getExitDate();
        }
        return selected;
    }
}
