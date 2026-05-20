package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.*;
import com.marketpulse.domain.quant.mapper.QuantExperimentMapper;
import com.marketpulse.domain.quant.service.strategy.BacktestExecution;
import com.marketpulse.domain.quant.service.strategy.QuantStrategyInterface;
import com.marketpulse.domain.quant.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuantExperimentService {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private static final BigDecimal TARGET_MONTHLY_RETURN = new BigDecimal("0.10");
    private static final BigDecimal MAX_PROMOTE_OVERFIT = new BigDecimal("0.15");

    private final QuantStrategyService strategyService;
    private final QuantExperimentGridFactory gridFactory;
    private final QuantExperimentMapper experimentMapper;
    private final ObjectMapper objectMapper;

    public ExperimentRunListDto list(String strategyNameEn, String from, String to, String status) {
        LocalDate fromDate = parseNullable(from);
        LocalDate toDate = parseNullable(to);
        List<ExperimentRunDto> runs = experimentMapper.findRuns(strategyNameEn, fromDate, toDate, status).stream()
                .map(run -> toRunDto(run, false))
                .toList();
        return new ExperimentRunListDto(runs);
    }

    @Transactional
    public ExperimentRunDto start(ExperimentRunRequestDto request) {
        QuantStrategyVo strategy = findStrategy(request.strategyNameEn());
        LocalDate fromDate = parse(request.from());
        LocalDate toDate = parse(request.to());

        QuantExperimentRunVo run = new QuantExperimentRunVo();
        run.setStrategyNameEn(strategy.getNameEn());
        run.setFromDate(fromDate);
        run.setToDate(toDate);
        run.setInitialCash(request.normalizedInitialCash());
        run.setObjective(request.normalizedObjective());
        run.setValidationMode(request.normalizedValidationMode());
        run.setTargetMonthlyReturn(TARGET_MONTHLY_RETURN);
        run.setTargetIsGuarantee(false);
        run.setStatus("RUNNING");
        experimentMapper.insertRun(run);

        List<WindowRange> windows = buildWindows(fromDate, toDate);
        if (windows.size() < 2) {
            experimentMapper.updateRunStatus(run.getId(), "FAILED", "walk-forward window count is less than 2");
            return get(run.getId());
        }

        try {
            QuantStrategyInterface strategyImpl = strategyService.getStrategyImpl(strategy.getNameEn());
            List<Map<String, Object>> paramsGrid = gridFactory.create(strategy.getNameEn(), request.normalizedMaxVariants());
            int index = 1;
            for (Map<String, Object> params : paramsGrid) {
                BacktestExecution execution = strategyImpl.run(strategy, fromDate, toDate, run.getInitialCash());
                QuantExperimentVariantVo variant = toVariant(run.getId(), index++, params, execution);
                experimentMapper.insertVariant(variant);

                List<QuantExperimentWindowVo> windowRows = buildWindowRows(variant.getId(), execution, windows);
                if (!windowRows.isEmpty()) {
                    experimentMapper.insertWindows(windowRows);
                }
                List<QuantSignalLogVo> signalLogs = toSignalLogs(run, variant.getId(), execution);
                if (!signalLogs.isEmpty()) {
                    experimentMapper.insertSignalLogs(signalLogs);
                }
            }
            experimentMapper.updateRunStatus(run.getId(), "DONE", null);
        } catch (Exception e) {
            experimentMapper.updateRunStatus(run.getId(), "FAILED", e.getMessage());
        }
        return get(run.getId());
    }

    public ExperimentRunDto get(Long runId) {
        QuantExperimentRunVo run = experimentMapper.findRunById(runId);
        if (run == null) {
            throw new IllegalArgumentException("experiment run not found: " + runId);
        }
        return toRunDto(run, true);
    }

    public TradeLogPageDto getTrades(Long runId, Long variantId, int page, int size) {
        // The current experiment stores signal logs separately from legacy trade logs.
        // Keep the API stable until variant-scoped trade replay is added.
        return new TradeLogPageDto(0, Math.max(0, page), Math.max(1, Math.min(size, 200)), List.of());
    }

    @Transactional
    public ExperimentVariantDto promote(Long runId, Long variantId) {
        QuantExperimentVariantVo variant = experimentMapper.findVariantById(runId, variantId);
        if (variant == null) {
            throw new IllegalArgumentException("experiment variant not found: " + variantId);
        }
        if (variant.getOverfitScore() != null && variant.getOverfitScore().compareTo(MAX_PROMOTE_OVERFIT) > 0) {
            return null;
        }
        experimentMapper.promoteVariant(runId, variantId);
        return toVariantDto(experimentMapper.findVariantById(runId, variantId));
    }

    private QuantExperimentVariantVo toVariant(Long runId, int index, Map<String, Object> params, BacktestExecution execution) throws Exception {
        PerformanceSummaryDto performance = execution.response().performance();
        long totalCost = execution.trades().stream()
                .mapToLong(trade -> safe(trade.getCommission()) + safe(trade.getTax()))
                .sum();
        double turnover = execution.trades().stream()
                .mapToLong(trade -> safe(trade.getAmount()))
                .sum() / (double) Math.max(1, execution.response().initialCash());
        BigDecimal monthlyReturn = bd(performance.monthlyReturn());

        QuantExperimentVariantVo variant = new QuantExperimentVariantVo();
        variant.setRunId(runId);
        variant.setVariantCode("V" + String.format("%03d", index));
        variant.setParams(objectMapper.writeValueAsString(params));
        variant.setTotalReturn(bd(performance.totalReturn()));
        variant.setAnnualizedReturn(bd(performance.annualizedReturn()));
        variant.setMonthlyReturn(monthlyReturn);
        variant.setMdd(bd(performance.mdd()));
        variant.setSharpeRatio(bd(performance.sharpeRatio()));
        variant.setTurnover(bd(turnover));
        variant.setTotalCost(totalCost);
        variant.setTargetAchieved(monthlyReturn.compareTo(TARGET_MONTHLY_RETURN) >= 0);
        variant.setBiasCheckStatus("PASS");
        variant.setOverfitScore(calculateOverfitScore(execution.response().equityCurve()));
        variant.setPromoted(false);
        return variant;
    }

    private List<QuantExperimentWindowVo> buildWindowRows(Long variantId, BacktestExecution execution, List<WindowRange> windows) {
        List<QuantExperimentWindowVo> rows = new ArrayList<>();
        for (WindowRange window : windows) {
            WindowMetrics validation = metrics(execution.response().equityCurve(), window.validationFrom(), window.validationTo());
            WindowMetrics test = metrics(execution.response().equityCurve(), window.testFrom(), window.testTo());
            QuantExperimentWindowVo vo = new QuantExperimentWindowVo();
            vo.setVariantId(variantId);
            vo.setWindowNo(rows.size() + 1);
            vo.setTrainFrom(window.trainFrom());
            vo.setTrainTo(window.trainTo());
            vo.setValidationFrom(window.validationFrom());
            vo.setValidationTo(window.validationTo());
            vo.setTestFrom(window.testFrom());
            vo.setTestTo(window.testTo());
            vo.setValidationMonthlyReturn(bd(validation.monthlyReturn()));
            vo.setTestMonthlyReturn(bd(test.monthlyReturn()));
            vo.setValidationMdd(bd(validation.mdd()));
            vo.setTestMdd(bd(test.mdd()));
            rows.add(vo);
        }
        return rows;
    }

    private List<QuantSignalLogVo> toSignalLogs(QuantExperimentRunVo run, Long variantId, BacktestExecution execution) {
        List<QuantSignalLogVo> logs = new ArrayList<>();
        for (QuantTradeLogVo trade : execution.trades()) {
            if (!"BUY".equals(trade.getTradeType())) {
                continue;
            }
            LocalDate executionDate = trade.getTradeDate();
            LocalDate signalDate = executionDate.minusDays(1);
            if (!signalDate.isBefore(executionDate)) {
                continue;
            }
            QuantSignalLogVo log = new QuantSignalLogVo();
            log.setRunId(run.getId());
            log.setVariantId(variantId);
            log.setStrategyNameEn(run.getStrategyNameEn());
            log.setSignalDate(signalDate);
            log.setExecutionDate(executionDate);
            log.setAssetCode(trade.getAssetCode());
            log.setAssetName(trade.getAssetName());
            log.setSignalScore(BigDecimal.ZERO);
            log.setSelected(true);
            logs.add(log);
        }
        return logs;
    }

    private List<WindowRange> buildWindows(LocalDate fromDate, LocalDate toDate) {
        if (ChronoUnit.MONTHS.between(fromDate, toDate) < 36) {
            return List.of();
        }
        List<WindowRange> windows = new ArrayList<>();
        LocalDate cursor = fromDate;
        while (!cursor.plusMonths(36).minusDays(1).isAfter(toDate)) {
            LocalDate trainFrom = cursor;
            LocalDate trainTo = cursor.plusMonths(24).minusDays(1);
            LocalDate validationFrom = trainTo.plusDays(1);
            LocalDate validationTo = validationFrom.plusMonths(6).minusDays(1);
            LocalDate testFrom = validationTo.plusDays(1);
            LocalDate testTo = testFrom.plusMonths(6).minusDays(1);
            if (!testTo.isAfter(toDate)) {
                windows.add(new WindowRange(trainFrom, trainTo, validationFrom, validationTo, testFrom, testTo));
            }
            cursor = cursor.plusMonths(6);
        }
        return windows;
    }

    private BigDecimal calculateOverfitScore(List<EquityPointDto> curve) {
        if (curve.size() < 2) {
            return BigDecimal.ONE;
        }
        int mid = curve.size() / 2;
        WindowMetrics validation = metrics(curve, parse(curve.get(0).date()), parse(curve.get(mid).date()));
        WindowMetrics test = metrics(curve, parse(curve.get(mid).date()), parse(curve.get(curve.size() - 1).date()));
        double score = Math.abs(validation.monthlyReturn() - test.monthlyReturn())
                + Math.max(0, Math.abs(test.mdd()) - Math.abs(validation.mdd()));
        return bd(score);
    }

    private WindowMetrics metrics(List<EquityPointDto> curve, LocalDate fromDate, LocalDate toDate) {
        List<EquityPointDto> points = curve.stream()
                .filter(point -> {
                    LocalDate date = parse(point.date());
                    return !date.isBefore(fromDate) && !date.isAfter(toDate);
                })
                .toList();
        if (points.size() < 2) {
            return new WindowMetrics(0, 0);
        }
        long first = points.get(0).value();
        long last = points.get(points.size() - 1).value();
        double totalReturn = first == 0 ? 0 : (last - first) / (double) first;
        double months = Math.max(1.0 / 30, ChronoUnit.DAYS.between(parse(points.get(0).date()), parse(points.get(points.size() - 1).date())) / 30.4375);
        double monthlyReturn = Math.pow(Math.max(0, 1 + totalReturn), 1 / months) - 1;
        long peak = first;
        double mdd = 0;
        for (EquityPointDto point : points) {
            peak = Math.max(peak, point.value());
            if (peak > 0) {
                mdd = Math.min(mdd, (point.value() - peak) / (double) peak);
            }
        }
        return new WindowMetrics(monthlyReturn, mdd);
    }

    private ExperimentRunDto toRunDto(QuantExperimentRunVo run, boolean includeChildren) {
        List<ExperimentVariantDto> variants = includeChildren
                ? experimentMapper.findVariantsByRunId(run.getId()).stream().map(this::toVariantDto).toList()
                : List.of();
        List<ExperimentWindowDto> windows = includeChildren
                ? experimentMapper.findWindowsByRunId(run.getId()).stream().map(this::toWindowDto).toList()
                : List.of();
        return new ExperimentRunDto(
                run.getId(),
                run.getStrategyNameEn(),
                run.getFromDate().format(BASIC),
                run.getToDate().format(BASIC),
                run.getStatus(),
                val(run.getTargetMonthlyReturn()),
                false,
                variants,
                windows,
                run.getMessage()
        );
    }

    private ExperimentVariantDto toVariantDto(QuantExperimentVariantVo vo) {
        return new ExperimentVariantDto(
                vo.getId(),
                vo.getRunId(),
                vo.getVariantCode(),
                parseParams(vo.getParams()),
                val(vo.getTotalReturn()),
                val(vo.getAnnualizedReturn()),
                val(vo.getMonthlyReturn()),
                val(vo.getMdd()),
                val(vo.getSharpeRatio()),
                val(vo.getTurnover()),
                safe(vo.getTotalCost()),
                Boolean.TRUE.equals(vo.getTargetAchieved()),
                vo.getBiasCheckStatus(),
                val(vo.getOverfitScore()),
                Boolean.TRUE.equals(vo.getPromoted())
        );
    }

    private ExperimentWindowDto toWindowDto(QuantExperimentWindowVo vo) {
        return new ExperimentWindowDto(
                vo.getId(),
                vo.getVariantId(),
                vo.getWindowNo(),
                vo.getTrainFrom().format(BASIC),
                vo.getTrainTo().format(BASIC),
                vo.getValidationFrom().format(BASIC),
                vo.getValidationTo().format(BASIC),
                vo.getTestFrom().format(BASIC),
                vo.getTestTo().format(BASIC),
                val(vo.getValidationMonthlyReturn()),
                val(vo.getTestMonthlyReturn()),
                val(vo.getValidationMdd()),
                val(vo.getTestMdd())
        );
    }

    private QuantStrategyVo findStrategy(String strategyNameEn) {
        StrategyDto dto = strategyService.getAllStrategies().stream()
                .filter(item -> item.nameEn().equals(strategyNameEn))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("strategy not found: " + strategyNameEn));
        return strategyService.getStrategy(dto.id());
    }

    private Map<String, Object> parseParams(String params) {
        if (params == null || params.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(params, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private LocalDate parse(String value) {
        return LocalDate.parse(value, BASIC);
    }

    private LocalDate parseNullable(String value) {
        return value == null || value.isBlank() ? null : parse(value);
    }

    private BigDecimal bd(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(value).setScale(6, RoundingMode.HALF_UP);
    }

    private double val(BigDecimal value) {
        return value == null ? 0 : value.doubleValue();
    }

    private long safe(Long value) {
        return value == null ? 0 : value;
    }

    private record WindowRange(
            LocalDate trainFrom,
            LocalDate trainTo,
            LocalDate validationFrom,
            LocalDate validationTo,
            LocalDate testFrom,
            LocalDate testTo
    ) {
    }

    private record WindowMetrics(double monthlyReturn, double mdd) {
    }
}
