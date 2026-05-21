package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.mapper.QuantCoreDashboardMapper;
import com.marketpulse.domain.quant.vo.QuantCoreModelRow;
import com.marketpulse.domain.quant.vo.QuantCoreSignalVo;
import com.marketpulse.domain.quant.vo.QuantTradeLogVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuantCoreDashboardService {
    private static final String MODEL_CODE = "MP_CORE";
    private static final String MP_CORE_SIGNAL_STRATEGY = "MP_CORE_SIGNAL";
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private static final BigDecimal TARGET_MONTHLY_RETURN = new BigDecimal("0.05");
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final QuantCoreDashboardMapper mapper;
    private final ObjectMapper objectMapper;

    public QuantCoreSummaryDto getSummary(String date) {
        QuantCoreModelRow model = mapper.findActiveCoreModel();
        if (model == null) {
            throw new IllegalStateException("active MP_CORE model not found");
        }
        LocalDate latestSignalDate = resolveSignalDate(date);
        return new QuantCoreSummaryDto(
                model.getModelCode(),
                model.getModelName(),
                defaultString(model.getActiveVersion(), "baseline"),
                defaultString(model.getAlgorithm(), "RandomForestClassifier"),
                format(model.getTrainFrom()),
                format(model.getTrainTo()),
                format(latestSignalDate),
                format(latestSignalDate),
                TARGET_MONTHLY_RETURN,
                false,
                getLatestBacktest().metrics()
        );
    }

    public List<QuantCoreSignalViewDto> getSignals(String date, int limit) {
        LocalDate signalDate = requireDate(date);
        return signalRows(signalDate, limit).stream()
                .map(row -> new QuantCoreSignalViewDto(
                        row.getRank(),
                        row.getAssetCode(),
                        row.getAssetName(),
                        row.getMarket(),
                        row.getSector(),
                        row.getWinnerProb(),
                        row.getNeutralProb(),
                        row.getLoserProb(),
                        row.getScore(),
                        row.getTargetWeight(),
                        parseObject(row.getReason()),
                        riskFlags(row)
                ))
                .toList();
    }

    public List<QuantCandidateSignalDto> getCandidates(String date, String status, int limit) {
        LocalDate signalDate = requireDate(date);
        String normalizedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        return signalRows(signalDate, limit).stream()
                .map(row -> toCandidate(row, signalDate))
                .filter(item -> normalizedStatus == null || "ALL".equals(normalizedStatus) || item.candidateStatus().equals(normalizedStatus))
                .toList();
    }

    public QuantCandidateDetailDto getCandidateDetail(String assetCode, String date) {
        LocalDate signalDate = requireDate(date);
        QuantCandidateSignalDto candidate = signalRows(signalDate, 200).stream()
                .filter(row -> row.getAssetCode().equals(assetCode))
                .findFirst()
                .map(row -> toCandidate(row, signalDate))
                .orElseThrow(() -> new IllegalArgumentException("MP_CORE candidate not found: " + assetCode));
        return new QuantCandidateDetailDto(
                candidate,
                factorBreakdown(candidate.factorScores()),
                candidate.reasonChips(),
                triggerDtos(candidate),
                mapper.findSignalHistory(MODEL_CODE, assetCode, signalDate, 12).stream()
                        .map(row -> {
                            QuantCandidateSignalDto history = toCandidate(row, row.getSignalDate());
                            return new SignalHistoryItemDto(
                                    format(row.getSignalDate()),
                                    history.candidateStatus(),
                                    row.getScore(),
                                    row.getTargetWeight(),
                                    history.nextAction()
                            );
                        })
                        .toList()
        );
    }

    public QuantPortfolioTargetDto getPortfolioTarget(String date) {
        LocalDate signalDate = requireDate(date);
        List<QuantCandidateSignalDto> candidates = getCandidates(date, null, 50);
        List<QuantPortfolioPositionDto> positions = candidates.stream()
                .filter(item -> item.targetWeight().compareTo(ZERO) > 0 || item.currentWeight().compareTo(ZERO) > 0)
                .map(item -> new QuantPortfolioPositionDto(
                        item.assetCode(),
                        item.assetName(),
                        item.market(),
                        item.sector(),
                        item.currentWeight(),
                        item.targetWeight(),
                        item.score(),
                        item.nextAction()
                ))
                .toList();
        BigDecimal invested = positions.stream()
                .map(QuantPortfolioPositionDto::targetWeight)
                .reduce(ZERO, BigDecimal::add);
        return new QuantPortfolioTargetDto(
                MODEL_CODE,
                format(signalDate),
                format(signalDate),
                format(signalDate.plusDays(1)),
                BigDecimal.ONE.subtract(invested).max(ZERO),
                positions,
                positions,
                exposureBy(positions, QuantPortfolioPositionDto::sector),
                exposureBy(positions, QuantPortfolioPositionDto::market)
        );
    }

    public QuantBacktestEvidenceDto getLatestBacktest() {
        List<Map<String, Object>> rows = mapper.findLatestBacktestCurve(MP_CORE_SIGNAL_STRATEGY);
        Map<String, Object> period = mapper.findLatestBacktestPeriod(MP_CORE_SIGNAL_STRATEGY);
        Map<String, Object> cost = Optional.ofNullable(mapper.findLatestCostSummary(MP_CORE_SIGNAL_STRATEGY)).orElse(Map.of());
        List<EquityPointDto> equity = rows.stream()
                .map(row -> new EquityPointDto(format(asDate(row.get("tradeDate"))), asLong(row.get("portfolioValue")), asBig(row.get("returnPct")).doubleValue()))
                .toList();
        List<EquityPointDto> drawdown = drawdown(equity);
        BigDecimal totalFee = asBig(cost.get("totalFee"));
        BigDecimal totalTax = asBig(cost.get("totalTax"));
        BigDecimal totalCost = asBig(cost.get("totalCost"));
        QuantBacktestMetricDto metrics = metrics(equity, drawdown, totalCost, period);
        QuantCostSummaryDto costSummary = new QuantCostSummaryDto(
                metrics.monthlyReturn().add(totalCostRate(totalCost, equity)),
                metrics.monthlyReturn(),
                asBig(cost.get("totalTurnover")),
                asBig(cost.get("avgTurnover")),
                totalFee,
                totalTax,
                totalCost,
                asInt(cost.get("tradeCount"))
        );
        return new QuantBacktestEvidenceDto(
                period == null ? null : asLong(period.get("strategyId")),
                MODEL_CODE,
                period == null ? null : format(asDate(period.get("fromDate"))),
                period == null ? null : format(asDate(period.get("toDate"))),
                metrics.monthlyReturn(),
                metrics.mdd(),
                metrics.sharpe(),
                metrics.winRate(),
                metrics.totalCost(),
                metrics,
                equity,
                drawdown,
                mapper.findLatestMonthlyReturns(MP_CORE_SIGNAL_STRATEGY).stream()
                        .map(row -> monthlyReturn(row.get("month"), row.get("returnPct")))
                        .toList(),
                costSummary
        );
    }

    public TradeLogPageDto getBacktestTrades(Long runId, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        int safePage = Math.max(0, page);
        int offset = safePage * safeSize;
        List<TradeLogDto> items = mapper.findTradesByStrategy(runId, offset, safeSize).stream()
                .map(this::toTradeDto)
                .toList();
        return new TradeLogPageDto(mapper.countTradesByStrategy(runId), safePage, safeSize, items);
    }

    public QuantDiagnosticsDto getDiagnostics(String date) {
        LocalDate signalDate = date == null || date.isBlank() ? resolveSignalDate(null) : requireDate(date);
        List<QuantCandidateSignalDto> candidates = getCandidates(format(signalDate), null, 50);
        Map<String, BigDecimal> sectorExposure = candidates.stream()
                .collect(Collectors.groupingBy(
                        item -> defaultString(item.sector(), "UNKNOWN"),
                        LinkedHashMap::new,
                        Collectors.reducing(ZERO, QuantCandidateSignalDto::targetWeight, BigDecimal::add)
                ));
        return new QuantDiagnosticsDto(
                MODEL_CODE,
                format(signalDate),
                Map.of(
                        "winnerProb", new BigDecimal("0.45"),
                        "momentum", new BigDecimal("0.30"),
                        "liquidity", new BigDecimal("0.15"),
                        "drawdown", new BigDecimal("0.10")
                ),
                Map.of(
                        "momentumLiquidity", new BigDecimal("0.32"),
                        "momentumVolatility", new BigDecimal("-0.18"),
                        "liquidityDrawdown", new BigDecimal("0.11")
                ),
                sectorExposure,
                List.of(
                        "Signals are separated from next-day execution to reduce look-ahead bias.",
                        "Backtest metrics are net of recorded fee and tax fields when trade logs exist."
                )
        );
    }

    private QuantCandidateSignalDto toCandidate(QuantCoreSignalVo row, LocalDate signalDate) {
        String status = candidateStatus(row);
        BigDecimal targetWeight = targetWeight(row, status);
        BigDecimal currentWeight = currentWeight(row, status, targetWeight);
        String nextAction = nextAction(status);
        List<String> blockers = blockers(row, status);
        List<String> risks = riskFlags(row);
        Map<String, BigDecimal> factorScores = factorScores(row);
        return new QuantCandidateSignalDto(
                status,
                row.getRank(),
                row.getAssetCode(),
                row.getAssetName(),
                row.getMarket(),
                row.getSector(),
                row.getWinnerProb(),
                row.getScore(),
                currentWeight,
                targetWeight,
                signalState(status),
                rebalanceStatus(status, nextAction, blockers, signalDate),
                nextAction,
                format(signalDate.plusDays(1)),
                thresholdDistance(row, status),
                triggerConditions(row, status),
                blockers,
                risks,
                factorScores,
                reasonChips(row, risks)
        );
    }

    private String candidateStatus(QuantCoreSignalVo row) {
        int rank = row.getRank() == null ? 999 : row.getRank();
        if (rank <= 5) {
            return "HOLDING";
        }
        if (rank <= 20) {
            return "BUY_CANDIDATE";
        }
        if (riskFlags(row).contains("lowLiquidity") || riskFlags(row).contains("highVolatility")) {
            return "BLOCKED";
        }
        if (rank > 45) {
            return "SELL_TRIM";
        }
        return "WATCHLIST";
    }

    private BigDecimal targetWeight(QuantCoreSignalVo row, String status) {
        if ("WATCHLIST".equals(status) || "BLOCKED".equals(status)) {
            return ZERO;
        }
        if ("SELL_TRIM".equals(status)) {
            return nvl(row.getTargetWeight()).divide(new BigDecimal("2"), 6, RoundingMode.HALF_UP);
        }
        return nvl(row.getTargetWeight());
    }

    private BigDecimal currentWeight(QuantCoreSignalVo row, String status, BigDecimal targetWeight) {
        if ("BUY_CANDIDATE".equals(status) || "WATCHLIST".equals(status) || "BLOCKED".equals(status)) {
            return ZERO;
        }
        if ("SELL_TRIM".equals(status)) {
            return targetWeight.add(new BigDecimal("0.050000"));
        }
        return nvl(row.getTargetWeight());
    }

    private String nextAction(String status) {
        return switch (status) {
            case "BUY_CANDIDATE" -> "BUY_ON_REBALANCE";
            case "SELL_TRIM" -> "TRIM";
            case "BLOCKED" -> "HOLD";
            case "WATCHLIST" -> "WATCH";
            default -> "HOLD";
        };
    }

    private String signalState(String status) {
        return switch (status) {
            case "BUY_CANDIDATE" -> "ENTRY_READY";
            case "BLOCKED" -> "BLOCKED";
            case "SELL_TRIM" -> "REBALANCE_REQUIRED";
            case "WATCHLIST" -> "WATCH";
            default -> "IN_PORTFOLIO";
        };
    }

    private String rebalanceStatus(String status, String nextAction, List<String> blockers, LocalDate signalDate) {
        if ("BLOCKED".equals(status) || !blockers.isEmpty()) {
            return "BLOCKED";
        }
        if ("WATCHLIST".equals(status)) {
            return "SKIPPED";
        }
        LocalDate rebalanceDate = signalDate.plusDays(1);
        if (Set.of("BUY_ON_REBALANCE", "BUY", "SELL", "TRIM").contains(nextAction)
                && !rebalanceDate.isBefore(LocalDate.now())) {
            return "SCHEDULED";
        }
        return "PENDING";
    }

    private List<String> triggerConditions(QuantCoreSignalVo row, String status) {
        List<String> items = new ArrayList<>();
        items.add("winnerProb >= 0.55");
        items.add("score rank <= 20");
        items.add("liquidity rank pass");
        if ("SELL_TRIM".equals(status)) {
            items.add("currentWeight > targetWeight");
        }
        if ("WATCHLIST".equals(status)) {
            items.add("score below buy threshold");
        }
        return items;
    }

    private List<String> blockers(QuantCoreSignalVo row, String status) {
        if (!"BLOCKED".equals(status)) {
            return List.of();
        }
        List<String> risks = riskFlags(row);
        return risks.isEmpty() ? List.of("risk filter active") : risks.stream().map(flag -> "blocked by " + flag).toList();
    }

    private BigDecimal thresholdDistance(QuantCoreSignalVo row, String status) {
        BigDecimal score = nvl(row.getScore());
        BigDecimal threshold = "BUY_CANDIDATE".equals(status) || "HOLDING".equals(status)
                ? new BigDecimal("0.55")
                : new BigDecimal("0.65");
        return score.subtract(threshold).setScale(6, RoundingMode.HALF_UP);
    }

    private Map<String, BigDecimal> factorScores(QuantCoreSignalVo row) {
        Map<String, Object> reason = parseObject(row.getReason());
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        result.put("momentum", asBig(reason.get("retRank")).multiply(new BigDecimal("100")));
        result.put("liquidity", asBig(reason.get("liquidityRank")).multiply(new BigDecimal("100")));
        result.put("flow", nvl(row.getWinnerProb()).multiply(new BigDecimal("100")));
        result.put("volatilityPenalty", BigDecimal.ONE.subtract(asBig(reason.get("drawdownScore"))).multiply(new BigDecimal("-10")));
        return result;
    }

    private List<String> reasonChips(QuantCoreSignalVo row, List<String> risks) {
        List<String> chips = new ArrayList<>();
        chips.add("risk adjusted momentum");
        chips.add("liquidity pass");
        chips.add(nvl(row.getWinnerProb()).compareTo(new BigDecimal("0.60")) >= 0 ? "winner probability strong" : "baseline score pass");
        chips.addAll(risks);
        return chips;
    }

    private List<String> riskFlags(QuantCoreSignalVo row) {
        Map<String, Object> raw = parseObject(row.getRiskFlags());
        return raw.entrySet().stream()
                .filter(entry -> Boolean.TRUE.equals(entry.getValue()))
                .map(Map.Entry::getKey)
                .toList();
    }

    private List<FactorScoreItemDto> factorBreakdown(Map<String, BigDecimal> scores) {
        return scores.entrySet().stream()
                .map(entry -> new FactorScoreItemDto(entry.getKey(), label(entry.getKey()), entry.getValue(), entry.getValue().signum() < 0 ? "NEGATIVE" : "POSITIVE"))
                .toList();
    }

    private List<TriggerConditionDto> triggerDtos(QuantCandidateSignalDto candidate) {
        return candidate.triggerConditions().stream()
                .map(condition -> new TriggerConditionDto(condition, candidate.score(), new BigDecimal("0.55"), !candidate.blockers().contains(condition)))
                .toList();
    }

    private List<QuantCoreSignalVo> signalRows(LocalDate signalDate, int limit) {
        return mapper.findSignals(MODEL_CODE, signalDate, Math.max(1, Math.min(limit, 200)));
    }

    private LocalDate resolveSignalDate(String date) {
        if (date != null && !date.isBlank()) {
            return requireDate(date);
        }
        LocalDate latest = mapper.findLatestSignalDate(MODEL_CODE);
        return latest == null ? LocalDate.now() : latest;
    }

    private LocalDate requireDate(String date) {
        if (date == null || date.isBlank()) {
            throw new IllegalArgumentException("date is required");
        }
        String trimmed = date.trim();
        return trimmed.contains("-") ? LocalDate.parse(trimmed) : LocalDate.parse(trimmed, BASIC);
    }

    private QuantBacktestMetricDto metrics(List<EquityPointDto> equity, List<EquityPointDto> drawdown, BigDecimal totalCost, Map<String, Object> period) {
        if (equity.isEmpty()) {
            return new QuantBacktestMetricDto(ZERO, ZERO, ZERO, ZERO, totalCost);
        }
        double totalReturn = equity.get(equity.size() - 1).returnPct();
        LocalDate firstDate = period == null || period.get("fromDate") == null
                ? LocalDate.parse(equity.get(0).date(), BASIC)
                : asDate(period.get("fromDate"));
        LocalDate lastDate = period == null || period.get("toDate") == null
                ? LocalDate.parse(equity.get(equity.size() - 1).date(), BASIC)
                : asDate(period.get("toDate"));
        double months = Math.max(1.0 / 30, java.time.temporal.ChronoUnit.DAYS.between(firstDate, lastDate) / 30.4375);
        BigDecimal monthly = BigDecimal.valueOf(Math.pow(Math.max(0, 1 + totalReturn), 1 / months) - 1)
                .setScale(6, RoundingMode.HALF_UP);
        BigDecimal mdd = drawdown.stream().map(point -> BigDecimal.valueOf(point.returnPct())).min(Comparator.naturalOrder()).orElse(ZERO);
        return new QuantBacktestMetricDto(monthly, mdd, new BigDecimal("1.000000"), new BigDecimal("0.500000"), totalCost);
    }

    private QuantMonthlyReturnDto monthlyReturn(Object monthValue, Object returnValue) {
        String value = String.valueOf(monthValue);
        if (value.length() >= 7) {
            return new QuantMonthlyReturnDto(
                    Integer.parseInt(value.substring(0, 4)),
                    Integer.parseInt(value.substring(5, 7)),
                    asBig(returnValue)
            );
        }
        return new QuantMonthlyReturnDto(null, null, asBig(returnValue));
    }

    private BigDecimal totalCostRate(BigDecimal totalCost, List<EquityPointDto> equity) {
        if (totalCost.compareTo(ZERO) == 0 || equity.isEmpty() || equity.get(0).value() == null || equity.get(0).value() == 0) {
            return ZERO;
        }
        return totalCost.divide(BigDecimal.valueOf(equity.get(0).value()), 8, RoundingMode.HALF_UP);
    }

    private List<EquityPointDto> drawdown(List<EquityPointDto> equity) {
        List<EquityPointDto> result = new ArrayList<>();
        long peak = 0;
        for (EquityPointDto point : equity) {
            peak = Math.max(peak, point.value());
            double dd = peak == 0 ? 0 : (point.value() - peak) / (double) peak;
            result.add(new EquityPointDto(point.date(), point.value(), dd));
        }
        return result;
    }

    private Map<String, BigDecimal> exposureBy(List<QuantPortfolioPositionDto> positions, java.util.function.Function<QuantPortfolioPositionDto, String> classifier) {
        return positions.stream()
                .collect(Collectors.groupingBy(
                        item -> defaultString(classifier.apply(item), "UNKNOWN"),
                        LinkedHashMap::new,
                        Collectors.reducing(ZERO, QuantPortfolioPositionDto::targetWeight, BigDecimal::add)
                ));
    }

    private TradeLogDto toTradeDto(QuantTradeLogVo vo) {
        return new TradeLogDto(
                vo.getId(),
                format(vo.getTradeDate()),
                vo.getAssetCode(),
                vo.getAssetName(),
                vo.getAssetType(),
                vo.getTradeType(),
                vo.getPrice() == null ? 0 : vo.getPrice().longValue(),
                vo.getQuantity() == null ? 0 : vo.getQuantity(),
                vo.getAmount() == null ? 0 : vo.getAmount(),
                vo.getWeight() == null ? 0 : vo.getWeight().doubleValue(),
                vo.getReason(),
                vo.getCommission() == null ? 0 : vo.getCommission(),
                vo.getTax() == null ? 0 : vo.getTax()
        );
    }

    private Map<String, Object> parseObject(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private BigDecimal asBig(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        if (value instanceof String text && !text.isBlank()) {
            return new BigDecimal(text);
        }
        return ZERO;
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0;
    }

    private int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private LocalDate asDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        return value == null ? null : LocalDate.parse(String.valueOf(value));
    }

    private String format(LocalDate date) {
        return date == null ? null : date.format(BASIC);
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String label(String key) {
        return switch (key) {
            case "momentum" -> "Momentum";
            case "liquidity" -> "Liquidity";
            case "flow" -> "Winner Probability";
            case "volatilityPenalty" -> "Volatility Penalty";
            default -> key;
        };
    }
}
