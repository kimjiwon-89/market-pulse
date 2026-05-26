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
public class CandleMtfTrendNbStrategy extends AbstractQuantStrategy {
    private static final int TOP_N = 10;
    private static final int MAX_HOLD_DAYS = 30;

    public CandleMtfTrendNbStrategy(MarketDailyPriceMapper priceMapper) {
        super(priceMapper);
    }

    @Override
    public String getNameEn() {
        return "CANDLE_MTF_TREND_V3_FIN_NB";
    }

    @Override
    public BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash) {
        List<MonthlyPickVo> picks = priceMapper.findEventDrivenCandleMtfTrendNbPicks(fromDate, toDate, TOP_N, MAX_HOLD_DAYS);
        return simulateMonthlyPicks(strategy, fromDate, toDate, initialCash, filterNonOverlappingPicks(picks),
                "MTF V3-FIN-NB entry: W4 range/momentum filter, KOSPI/KOSDAQ MA20 regime, 5-day delay, entry and next-body confirmation",
                "MTF V3-FIN-NB exit: -8% early fail, -18% stop, 20/20 trail, 30-trading-day max hold");
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
