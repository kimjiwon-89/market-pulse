package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantBacktestResultVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import com.marketpulse.domain.quant.vo.QuantTradeLogVo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public abstract class AbstractQuantStrategy implements QuantStrategyInterface {
    protected static final BigDecimal COMMISSION_RATE = new BigDecimal("0.00015");
    protected static final BigDecimal SELL_TAX_RATE = new BigDecimal("0.0018");
    protected static final double TARGET_MONTHLY_RETURN = 0.10;
    protected static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;

    protected final MarketDailyPriceMapper priceMapper;

    protected AbstractQuantStrategy(MarketDailyPriceMapper priceMapper) {
        this.priceMapper = priceMapper;
    }

    protected BacktestExecution simulateSingleAsset(
            QuantStrategyVo strategy,
            LocalDate fromDate,
            LocalDate toDate,
            long initialCash,
            List<MarketDailyPriceVo> series,
            String buyReason,
            String sellReason,
            List<AllocationDto> allocation
    ) {
        if (series == null || series.isEmpty()) {
            BacktestResponseDto empty = new BacktestResponseDto(
                    strategy.getId(), strategy.getName(), fromDate.format(BASIC), toDate.format(BASIC), initialCash,
                    new PerformanceSummaryDto(0, 0, 0, TARGET_MONTHLY_RETURN, initialCash, 0, 0, 0, 0, 0, 0),
                    List.of(), allocation == null ? List.of() : allocation
            );
            return new BacktestExecution(empty, List.of(), List.of());
        }

        MarketDailyPriceVo first = series.get(0);
        MarketDailyPriceVo last = series.get(series.size() - 1);
        BigDecimal firstClose = nz(first.getClosePrice());
        BigDecimal lastClose = nz(last.getClosePrice());
        if (firstClose.compareTo(BigDecimal.ZERO) <= 0) {
            firstClose = BigDecimal.ONE;
        }

        long commission = BigDecimal.valueOf(initialCash).multiply(COMMISSION_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
        long investable = Math.max(0, initialCash - commission);
        long quantity = firstClose.compareTo(BigDecimal.ZERO) == 0 ? 0 : BigDecimal.valueOf(investable).divide(firstClose, 0, RoundingMode.DOWN).longValue();
        long used = firstClose.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
        long cash = initialCash - used - commission;

        List<QuantBacktestResultVo> results = new ArrayList<>();
        List<EquityPointDto> points = new ArrayList<>();
        long peak = initialCash;
        double maxDrawdown = 0;
        List<Double> dailyReturns = new ArrayList<>();
        long previousValue = initialCash;

        for (int i = 0; i < series.size(); i++) {
            MarketDailyPriceVo item = series.get(i);
            long equity = nz(item.getClosePrice()).multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
            long value = cash + equity;
            if (i == series.size() - 1) {
                long liquidationCommission = BigDecimal.valueOf(equity).multiply(COMMISSION_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
                long liquidationTax = BigDecimal.valueOf(equity).multiply(SELL_TAX_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
                value = cash + Math.max(0, equity - liquidationCommission - liquidationTax);
            }
            peak = Math.max(peak, value);
            if (peak > 0) {
                maxDrawdown = Math.min(maxDrawdown, (value - peak) / (double) peak);
            }
            if (previousValue > 0 && value != previousValue) {
                dailyReturns.add((value - previousValue) / (double) previousValue);
            }
            previousValue = value;

            double returnPct = (value - initialCash) / (double) initialCash;
            QuantBacktestResultVo vo = new QuantBacktestResultVo();
            vo.setStrategyId(strategy.getId());
            vo.setFromDate(fromDate);
            vo.setToDate(toDate);
            vo.setTradeDate(item.getTradeDate());
            vo.setPortfolioValue(value);
            vo.setReturnPct(BigDecimal.valueOf(returnPct).setScale(6, RoundingMode.HALF_UP));
            vo.setCash(cash);
            vo.setEquity(i == series.size() - 1 ? Math.max(0, value - cash) : equity);
            results.add(vo);
            points.add(new EquityPointDto(item.getTradeDate().format(BASIC), value, returnPct));
        }

        long sellAmount = lastClose.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
        long sellCommission = BigDecimal.valueOf(sellAmount).multiply(COMMISSION_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
        long tax = BigDecimal.valueOf(sellAmount).multiply(SELL_TAX_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
        double totalReturn = points.isEmpty() ? 0 : points.get(points.size() - 1).returnPct();
        double years = Math.max(1.0 / 365, ChronoUnit.DAYS.between(fromDate, toDate) / 365.0);
        double annualized = Math.pow(1 + totalReturn, 1 / years) - 1;
        double months = Math.max(1.0 / 30, ChronoUnit.DAYS.between(fromDate, toDate) / 30.4375);
        double monthlyReturn = Math.pow(Math.max(0, 1 + totalReturn), 1 / months) - 1;
        double sharpe = calcSharpe(dailyReturns);
        long finalValue = points.isEmpty() ? initialCash : points.get(points.size() - 1).value();
        long profitAmount = finalValue - initialCash;

        List<QuantTradeLogVo> trades = new ArrayList<>();
        trades.add(trade(strategy, fromDate, toDate, first, "BUY", firstClose, quantity, used, BigDecimal.ONE, buyReason, commission, 0));
        trades.add(trade(strategy, fromDate, toDate, last, "SELL", lastClose, quantity, sellAmount, BigDecimal.ZERO, sellReason, sellCommission, tax));

        BacktestResponseDto response = new BacktestResponseDto(
                strategy.getId(), strategy.getName(), fromDate.format(BASIC), toDate.format(BASIC), initialCash,
                new PerformanceSummaryDto(totalReturn, annualized, monthlyReturn, TARGET_MONTHLY_RETURN,
                        finalValue, profitAmount, totalReturn, maxDrawdown, sharpe, trades.size(), totalReturn > 0 ? 1 : 0),
                points,
                allocation == null || allocation.isEmpty()
                        ? List.of(new AllocationDto(first.getAssetName(), quantity > 0 ? 1 : 0))
                        : allocation
        );
        return new BacktestExecution(response, results, trades);
    }

    protected BacktestExecution simulateMonthlyPicks(
            QuantStrategyVo strategy,
            LocalDate fromDate,
            LocalDate toDate,
            long initialCash,
            List<MonthlyPickVo> picks,
            String buyReason,
            String sellReason
    ) {
        if (picks == null || picks.isEmpty()) {
            BacktestResponseDto empty = new BacktestResponseDto(
                    strategy.getId(), strategy.getName(), fromDate.format(BASIC), toDate.format(BASIC), initialCash,
                    new PerformanceSummaryDto(0, 0, 0, TARGET_MONTHLY_RETURN, initialCash, 0, 0, 0, 0, 0, 0),
                    List.of(), List.of()
            );
            return new BacktestExecution(empty, List.of(), List.of());
        }

        Map<LocalDate, List<MonthlyPickVo>> byMonth = new LinkedHashMap<>();
        for (MonthlyPickVo pick : picks) {
            byMonth.computeIfAbsent(pick.getRebalanceDate(), key -> new ArrayList<>()).add(pick);
        }

        long portfolioValue = initialCash;
        long peak = initialCash;
        double maxDrawdown = 0;
        long previousValue = initialCash;
        List<Double> periodReturns = new ArrayList<>();
        List<QuantBacktestResultVo> results = new ArrayList<>();
        List<EquityPointDto> points = new ArrayList<>();
        List<QuantTradeLogVo> trades = new ArrayList<>();
        List<AllocationDto> latestAllocation = new ArrayList<>();

        for (List<MonthlyPickVo> monthPicks : byMonth.values()) {
            long monthStartValue = portfolioValue;
            Map<MonthlyPickVo, BigDecimal> weights = calcDynamicWeights(monthPicks);
            BigDecimal investedWeight = weights.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            long cash = monthStartValue;
            long equity = 0;
            long sellProceeds = 0;
            latestAllocation = new ArrayList<>();

            for (MonthlyPickVo pick : monthPicks) {
                BigDecimal pickWeight = weights.getOrDefault(pick, BigDecimal.ZERO);
                if (pickWeight.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                BigDecimal buyPrice = nz(pick.getBuyPrice());
                BigDecimal sellPrice = nz(pick.getSellPrice());
                if (buyPrice.compareTo(BigDecimal.ZERO) <= 0 || sellPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                long perAssetBudget = BigDecimal.valueOf(monthStartValue).multiply(pickWeight).setScale(0, RoundingMode.DOWN).longValue();
                long buyCommission = BigDecimal.valueOf(perAssetBudget).multiply(COMMISSION_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
                long quantity = BigDecimal.valueOf(Math.max(0, perAssetBudget - buyCommission)).divide(buyPrice, 0, RoundingMode.DOWN).longValue();
                long buyAmount = buyPrice.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
                long grossSellAmount = sellPrice.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
                long sellCommission = BigDecimal.valueOf(grossSellAmount).multiply(COMMISSION_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
                long tax = BigDecimal.valueOf(grossSellAmount).multiply(SELL_TAX_RATE).setScale(0, RoundingMode.HALF_UP).longValue();
                long netSellAmount = grossSellAmount - sellCommission - tax;

                cash -= buyAmount + buyCommission;
                equity += grossSellAmount;
                sellProceeds += netSellAmount;

                MarketDailyPriceVo buyVo = pickToPrice(pick, pick.getRebalanceDate(), buyPrice);
                MarketDailyPriceVo sellVo = pickToPrice(pick, pick.getExitDate(), sellPrice);
                trades.add(trade(strategy, fromDate, toDate, buyVo, "BUY", buyPrice, quantity, buyAmount, pickWeight, buyReason, buyCommission, 0));
                trades.add(trade(strategy, fromDate, toDate, sellVo, "SELL", sellPrice, quantity, grossSellAmount, BigDecimal.ZERO, sellReason, sellCommission, tax));
                latestAllocation.add(new AllocationDto(pick.getAssetName(), pickWeight.doubleValue()));
            }

            if (investedWeight.compareTo(BigDecimal.ONE) < 0) {
                latestAllocation.add(new AllocationDto("현금", BigDecimal.ONE.subtract(investedWeight).doubleValue()));
            }

            portfolioValue = Math.max(0, cash + sellProceeds);
            peak = Math.max(peak, portfolioValue);
            if (peak > 0) {
                maxDrawdown = Math.min(maxDrawdown, (portfolioValue - peak) / (double) peak);
            }
            if (previousValue > 0) {
                periodReturns.add((portfolioValue - previousValue) / (double) previousValue);
            }
            previousValue = portfolioValue;

            MonthlyPickVo firstPick = monthPicks.get(0);
            double returnPct = (portfolioValue - initialCash) / (double) initialCash;
            QuantBacktestResultVo result = new QuantBacktestResultVo();
            result.setStrategyId(strategy.getId());
            result.setFromDate(fromDate);
            result.setToDate(toDate);
            result.setTradeDate(firstPick.getExitDate());
            result.setPortfolioValue(portfolioValue);
            result.setReturnPct(BigDecimal.valueOf(returnPct).setScale(6, RoundingMode.HALF_UP));
            result.setCash(cash);
            result.setEquity(equity);
            results.add(result);
            points.add(new EquityPointDto(firstPick.getExitDate().format(BASIC), portfolioValue, returnPct));
        }

        double totalReturn = points.isEmpty() ? 0 : points.get(points.size() - 1).returnPct();
        double years = Math.max(1.0 / 365, ChronoUnit.DAYS.between(fromDate, toDate) / 365.0);
        double annualized = Math.pow(1 + totalReturn, 1 / years) - 1;
        double months = Math.max(1.0 / 30, ChronoUnit.DAYS.between(fromDate, toDate) / 30.4375);
        double monthlyReturn = Math.pow(Math.max(0, 1 + totalReturn), 1 / months) - 1;
        double sharpe = calcSharpe(periodReturns);
        long finalValue = points.isEmpty() ? initialCash : points.get(points.size() - 1).value();
        long profitAmount = finalValue - initialCash;

        BacktestResponseDto response = new BacktestResponseDto(
                strategy.getId(), strategy.getName(), fromDate.format(BASIC), toDate.format(BASIC), initialCash,
                new PerformanceSummaryDto(totalReturn, annualized, monthlyReturn, TARGET_MONTHLY_RETURN,
                        finalValue, profitAmount, totalReturn, maxDrawdown, sharpe, trades.size(), totalReturn > 0 ? 1 : 0),
                points,
                latestAllocation
        );
        return new BacktestExecution(response, results, trades);
    }

    private Map<MonthlyPickVo, BigDecimal> calcDynamicWeights(List<MonthlyPickVo> picks) {
        Map<MonthlyPickVo, BigDecimal> weights = new LinkedHashMap<>();
        List<BigDecimal> rawScores = picks.stream()
                .map(this::rawPickScore)
                .toList();
        BigDecimal totalScore = rawScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalScore.compareTo(BigDecimal.ZERO) <= 0) {
            return weights;
        }

        BigDecimal averageScore = totalScore.divide(BigDecimal.valueOf(Math.max(1, picks.size())), 8, RoundingMode.HALF_UP);
        BigDecimal maxInvestWeight = averageScore.compareTo(new BigDecimal("0.03")) < 0
                ? new BigDecimal("0.55")
                : averageScore.compareTo(new BigDecimal("0.08")) < 0
                    ? new BigDecimal("0.75")
                    : BigDecimal.ONE;

        BigDecimal cappedTotal = BigDecimal.ZERO;
        List<BigDecimal> capped = new ArrayList<>();
        for (BigDecimal rawScore : rawScores) {
            BigDecimal weight = rawScore.divide(totalScore, 8, RoundingMode.HALF_UP).multiply(maxInvestWeight);
            BigDecimal maxSingle = new BigDecimal("0.18");
            if (weight.compareTo(maxSingle) > 0) {
                weight = maxSingle;
            }
            capped.add(weight);
            cappedTotal = cappedTotal.add(weight);
        }

        if (cappedTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return weights;
        }
        BigDecimal scale = cappedTotal.compareTo(maxInvestWeight) > 0
                ? maxInvestWeight.divide(cappedTotal, 8, RoundingMode.HALF_UP)
                : BigDecimal.ONE;
        for (int i = 0; i < picks.size(); i++) {
            BigDecimal weight = capped.get(i).multiply(scale).setScale(6, RoundingMode.HALF_UP);
            if (weight.compareTo(new BigDecimal("0.005")) >= 0) {
                weights.put(picks.get(i), weight);
            }
        }
        return weights;
    }

    private BigDecimal rawPickScore(MonthlyPickVo pick) {
        BigDecimal score = nz(pick.getScore()).max(BigDecimal.ZERO);
        if (score.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rankBoost = BigDecimal.ONE.divide(BigDecimal.valueOf(Math.max(1, Objects.requireNonNullElse(pick.getPickRank(), 1))), 8, RoundingMode.HALF_UP);
        BigDecimal sizeBoost = pick.getMarketCap() == null || pick.getMarketCap() <= 0
                ? BigDecimal.ONE
                : BigDecimal.valueOf(Math.log10(pick.getMarketCap()) / 12.0).max(new BigDecimal("0.50"));
        return score.multiply(new BigDecimal("0.80").add(rankBoost.multiply(new BigDecimal("0.20"))))
                .multiply(sizeBoost);
    }

    protected QuantTradeLogVo trade(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, MarketDailyPriceVo price,
                                    String tradeType, BigDecimal tradePrice, long quantity, long amount, BigDecimal weight,
                                    String reason, long commission, long tax) {
        QuantTradeLogVo vo = new QuantTradeLogVo();
        vo.setStrategyId(strategy.getId());
        vo.setFromDate(fromDate);
        vo.setToDate(toDate);
        vo.setTradeDate(price.getTradeDate());
        vo.setAssetCode(price.getAssetCode());
        vo.setAssetName(price.getAssetName());
        vo.setAssetType(price.getAssetType());
        vo.setTradeType(tradeType);
        vo.setPrice(tradePrice);
        vo.setQuantity(quantity);
        vo.setAmount(amount);
        vo.setWeight(weight);
        vo.setReason(reason);
        vo.setCommission(commission);
        vo.setTax(tax);
        return vo;
    }

    private MarketDailyPriceVo pickToPrice(MonthlyPickVo pick, LocalDate date, BigDecimal price) {
        MarketDailyPriceVo vo = new MarketDailyPriceVo();
        vo.setTradeDate(date);
        vo.setAssetCode(pick.getAssetCode());
        vo.setAssetName(pick.getAssetName());
        vo.setAssetType(pick.getAssetType());
        vo.setSector(pick.getSector());
        vo.setClosePrice(price);
        return vo;
    }

    protected double calcSharpe(List<Double> returns) {
        if (returns.size() < 2) {
            return 0;
        }
        double avg = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = returns.stream().mapToDouble(v -> Math.pow(v - avg, 2)).sum() / (returns.size() - 1);
        double std = Math.sqrt(variance);
        return std == 0 ? 0 : (avg / std) * Math.sqrt(252);
    }

    protected BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
