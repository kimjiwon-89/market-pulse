package com.marketpulse.domain.quant.service;

import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.mapper.QuantBacktestResultMapper;
import com.marketpulse.domain.quant.mapper.QuantTradeLogMapper;
import com.marketpulse.domain.quant.service.strategy.BacktestExecution;
import com.marketpulse.domain.quant.service.strategy.QuantStrategyInterface;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.QuantBacktestResultVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import com.marketpulse.domain.quant.vo.QuantTradeLogVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuantBacktestService {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private static final double TARGET_MONTHLY_RETURN = 0.10;
    private static final String MP_CORE_SIGNAL_STRATEGY = "MP_CORE_SIGNAL";

    private final QuantStrategyService strategyService;
    private final QuantBacktestResultMapper resultMapper;
    private final QuantTradeLogMapper tradeLogMapper;
    private final MarketDailyPriceMapper priceMapper;

    @Transactional
    public BacktestResponseDto backtest(BacktestRequestDto req) {
        LocalDate fromDate = parse(req.from());
        LocalDate toDate = parse(req.to());
        QuantStrategyVo strategy = strategyService.getStrategy(req.normalizedStrategyId());
        return runBacktest(strategy, fromDate, toDate, req.normalizedInitialCash(), false);
    }

    @Transactional
    public BacktestResponseDto backtestCore(BacktestRequestDto req) {
        LocalDate fromDate = parse(req.from());
        LocalDate toDate = parse(req.to());
        QuantStrategyVo strategy = strategyService.getStrategyByNameEn(MP_CORE_SIGNAL_STRATEGY);
        return runBacktest(strategy, fromDate, toDate, req.normalizedInitialCash(), true);
    }

    private BacktestResponseDto runBacktest(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate,
                                            long initialCash, boolean refresh) {
        if (refresh) {
            resultMapper.deleteByStrategyAndPeriod(strategy.getId(), fromDate, toDate);
            tradeLogMapper.deleteByStrategyAndPeriod(strategy.getId(), fromDate, toDate);
        }
        List<QuantBacktestResultVo> cached = resultMapper.findByStrategyAndPeriod(strategy.getId(), fromDate, toDate);
        if (!cached.isEmpty()) {
            return toResponse(strategy, fromDate, toDate, initialCash, cached);
        }

        QuantStrategyInterface impl = strategyService.getStrategyImpl(strategy.getNameEn());
        BacktestExecution execution = impl.run(strategy, fromDate, toDate, initialCash);
        if (!execution.results().isEmpty()) {
            resultMapper.insertBatch(execution.results());
        }
        if (!execution.trades().isEmpty()) {
            tradeLogMapper.deleteByStrategyAndPeriod(strategy.getId(), fromDate, toDate);
            tradeLogMapper.insertBatch(execution.trades());
        }
        return execution.response();
    }

    public PerformanceResponseDto compareAll(String from, String to, List<Long> strategyIds) {
        List<StrategyDto> strategies = strategyService.getAllStrategies();
        List<Long> selected = strategyIds == null || strategyIds.isEmpty()
                ? strategies.stream().map(StrategyDto::id).toList()
                : strategyIds;

        List<StrategyPerformanceDto> items = selected.stream()
                .map(id -> backtest(new BacktestRequestDto(id, from, to, 100_000_000L)))
                .map(res -> new StrategyPerformanceDto(
                        res.strategyId(),
                        res.strategyName(),
                        res.performance().totalReturn(),
                        res.performance().mdd(),
                        res.performance().sharpeRatio(),
                        normalize(res.equityCurve())
                ))
                .toList();

        LocalDate fromDate = parse(from);
        LocalDate toDate = parse(to);
        return new PerformanceResponseDto(
                from,
                to,
                normalize(toPoints(priceMapper.findByCodeAndDateRange("KOSPI", "INDEX", fromDate, toDate), 100_000_000L)),
                normalize(toPoints(priceMapper.findByCodeAndDateRange("KOSDAQ", "INDEX", fromDate, toDate), 100_000_000L)),
                items
        );
    }

    public TradeLogPageDto getTradeLogs(Long strategyId, String from, String to, String tradeType, int page, int size) {
        LocalDate fromDate = parse(from);
        LocalDate toDate = parse(to);
        int normalizedSize = Math.max(1, Math.min(size, 200));
        int offset = Math.max(0, page) * normalizedSize;
        int total = tradeLogMapper.countByStrategyAndPeriod(strategyId, fromDate, toDate, tradeType);
        List<TradeLogDto> items = tradeLogMapper.findPageByStrategyAndPeriod(
                        strategyId, fromDate, toDate, tradeType, offset, normalizedSize
                ).stream()
                .map(this::toTradeDto)
                .toList();
        return new TradeLogPageDto(total, Math.max(0, page), normalizedSize, items);
    }

    @Transactional
    public void clearCache(String from, String to) {
        LocalDate fromDate = parse(from);
        LocalDate toDate = parse(to);
        tradeLogMapper.deleteByPeriodOverlap(fromDate, toDate);
        resultMapper.deleteByPeriodOverlap(fromDate, toDate);
    }

    private BacktestResponseDto toResponse(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate,
                                           long initialCash, List<QuantBacktestResultVo> rows) {
        List<EquityPointDto> curve = rows.stream()
                .map(row -> new EquityPointDto(row.getTradeDate().format(BASIC), row.getPortfolioValue(), val(row.getReturnPct())))
                .toList();
        return new BacktestResponseDto(
                strategy.getId(),
                strategy.getName(),
                fromDate.format(BASIC),
                toDate.format(BASIC),
                initialCash,
                calcPerformance(rows, tradeLogMapper.countByStrategyAndPeriod(strategy.getId(), fromDate, toDate, null)),
                curve,
                List.of()
        );
    }

    private PerformanceSummaryDto calcPerformance(List<QuantBacktestResultVo> curve, int totalTrades) {
        if (curve.isEmpty()) {
            return new PerformanceSummaryDto(0, 0, 0, TARGET_MONTHLY_RETURN, 0, 0, 0, 0, 0, totalTrades, 0);
        }
        long first = curve.get(0).getPortfolioValue();
        long last = curve.get(curve.size() - 1).getPortfolioValue();
        double totalReturn = first == 0 ? 0 : (last - first) / (double) first;
        double years = Math.max(1.0 / 365, ChronoUnit.DAYS.between(curve.get(0).getTradeDate(), curve.get(curve.size() - 1).getTradeDate()) / 365.0);
        double annualized = Math.pow(1 + totalReturn, 1 / years) - 1;
        double months = Math.max(1.0 / 30, ChronoUnit.DAYS.between(curve.get(0).getTradeDate(), curve.get(curve.size() - 1).getTradeDate()) / 30.4375);
        double monthlyReturn = Math.pow(Math.max(0, 1 + totalReturn), 1 / months) - 1;
        long peak = first;
        double mdd = 0;
        for (QuantBacktestResultVo point : curve) {
            peak = Math.max(peak, point.getPortfolioValue());
            if (peak > 0) {
                mdd = Math.min(mdd, (point.getPortfolioValue() - peak) / (double) peak);
            }
        }
        return new PerformanceSummaryDto(totalReturn, annualized, monthlyReturn, TARGET_MONTHLY_RETURN,
                last, last - first, totalReturn, mdd, 0, totalTrades, totalReturn > 0 ? 1 : 0);
    }

    private List<EquityPointDto> toPoints(List<MarketDailyPriceVo> prices, long initialValue) {
        if (prices.isEmpty()) {
            return List.of();
        }
        BigDecimal first = prices.get(0).getClosePrice();
        if (first == null || first.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }
        return prices.stream()
                .map(item -> {
                    double ratio = item.getClosePrice().divide(first, 8, java.math.RoundingMode.HALF_UP).doubleValue();
                    long value = Math.round(initialValue * ratio);
                    return new EquityPointDto(item.getTradeDate().format(BASIC), value, ratio - 1);
                })
                .toList();
    }

    private List<EquityPointDto> normalize(List<EquityPointDto> points) {
        if (points.isEmpty()) {
            return points;
        }
        long first = points.get(0).value() == null || points.get(0).value() == 0 ? 1 : points.get(0).value();
        return points.stream()
                .map(point -> {
                    long value = Math.round(point.value() / (double) first * 100);
                    return new EquityPointDto(point.date(), value, value / 100.0 - 1);
                })
                .toList();
    }

    private TradeLogDto toTradeDto(QuantTradeLogVo vo) {
        return new TradeLogDto(
                vo.getId(),
                vo.getTradeDate().format(BASIC),
                vo.getAssetCode(),
                vo.getAssetName(),
                vo.getAssetType(),
                vo.getTradeType(),
                vo.getPrice() == null ? 0 : vo.getPrice().longValue(),
                vo.getQuantity() == null ? 0 : vo.getQuantity(),
                vo.getAmount() == null ? 0 : vo.getAmount(),
                val(vo.getWeight()),
                vo.getReason(),
                vo.getCommission() == null ? 0 : vo.getCommission(),
                vo.getTax() == null ? 0 : vo.getTax()
        );
    }

    private LocalDate parse(String value) {
        return LocalDate.parse(value, BASIC);
    }

    private double val(BigDecimal value) {
        return value == null ? 0 : value.doubleValue();
    }
}
