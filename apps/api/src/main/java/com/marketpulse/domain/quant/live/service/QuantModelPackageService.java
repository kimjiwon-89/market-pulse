package com.marketpulse.domain.quant.live.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantCandidateDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantExitPlanDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantPositionDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantTradeDto;
import com.marketpulse.domain.quant.live.dto.LearningFeedbackDto;
import com.marketpulse.domain.quant.live.dto.OutcomeCheckpointDto;
import com.marketpulse.domain.quant.live.dto.ReportSectionDto;
import com.marketpulse.domain.quant.live.dto.WatchedAssetDto;
import com.marketpulse.domain.quant.live.dto.QuantModelPackageDto;
import com.marketpulse.domain.quant.live.dto.QuantModelPackageVisibilityRequest;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.mapper.QuantModelPackageRegistryMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.QuantModelPackageRegistryVo;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

@Service
public class QuantModelPackageService {
    private static final BigDecimal DEFAULT_SEED_MONEY = new BigDecimal("100000000");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final QuantModelPackageScanner scanner;
    private final QuantModelPackageRegistryMapper mapper;
    private final MarketDailyPriceMapper priceMapper;
    private final Path packageRoot;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public QuantModelPackageService(
            QuantModelPackageScanner scanner,
            QuantModelPackageRegistryMapper mapper,
            @Value("${market-pulse.quant.package-root:../../domains/quant-serving/packages}") String packageRoot,
            ObjectProvider<MarketDailyPriceMapper> priceMapper) {
        this.scanner = scanner;
        this.mapper = mapper;
        this.priceMapper = priceMapper.getIfAvailable();
        this.packageRoot = Path.of(packageRoot).toAbsolutePath().normalize();
    }

    public QuantModelPackageService(
            QuantModelPackageScanner scanner,
            QuantModelPackageRegistryMapper mapper,
            String packageRoot) {
        this.scanner = scanner;
        this.mapper = mapper;
        this.priceMapper = null;
        this.packageRoot = Path.of(packageRoot).toAbsolutePath().normalize();
    }

    public List<QuantModelPackageDto> scanAndList() {
        scanner.scan(packageRoot).forEach(spec -> mapper.upsertDetected(toVo(spec)));
        return list();
    }

    public List<QuantModelPackageDto> list() {
        return mapper.findAll().stream().map(this::toDto).toList();
    }

    public QuantModelPackageDto updateVisibility(String modelCode, QuantModelPackageVisibilityRequest request) {
        String status = request.packageStatus() == null || request.packageStatus().isBlank()
                ? (request.publicVisible() ? "APPROVED" : "DETECTED")
                : request.packageStatus();
        int updated = mapper.updateVisibility(modelCode, request.publicVisible(), status, request.adminNote());
        if (updated == 0) {
            throw new IllegalArgumentException("Unknown quant model package: " + modelCode);
        }
        return toDto(mapper.findByCode(modelCode));
    }

    public List<LiveQuantModelSummaryDto> publicVisibleSummaries() {
        return mapper.findPublicVisible().stream()
                .map(this::toSummary)
                .toList();
    }

    public LiveQuantModelDetailDto publicVisibleDetail(String modelCode) {
        QuantModelPackageRegistryVo vo = requirePublicVisible(modelCode);
        return new LiveQuantModelDetailDto(
                toSummary(vo),
                List.of(),
                packageCandidates(vo),
                packageTrades(vo),
                List.of(),
                List.of(),
                packageFeedback(vo)
        );
    }

    public List<LiveQuantCandidateDto> publicVisibleCandidates(String modelCode) {
        return packageCandidates(requirePublicVisible(modelCode));
    }

    public List<LiveQuantTradeDto> publicVisibleTrades(String modelCode) {
        return packageTrades(requirePublicVisible(modelCode));
    }

    public List<LiveQuantReportSummaryDto> publicVisibleReports(String period, String modelCode) {
        if (modelCode != null && !modelCode.isBlank()) {
            return List.of(packageReport(requirePublicVisible(modelCode)));
        }
        return mapper.findPublicVisible().stream().map(this::packageReport).toList();
    }

    public LiveQuantReportDetailDto publicVisibleReport(Long reportId) {
        QuantModelPackageRegistryVo vo = mapper.findPublicVisible().stream()
                .filter(item -> packageReportId(item.getModelCode()).equals(reportId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown visible quant package report: " + reportId));
        PackageMetrics metrics = metrics(vo);
        return new LiveQuantReportDetailDto(
                reportId,
                metrics.postEnd(),
                "VALIDATION",
                vo.getModelCode(),
                vo.getModelName() + " 과거 검증 리포트",
                "package-metrics",
                "전달된 검증 산출물 기준 과거 데이터 테스트 요약입니다. live order 또는 production runtime 활성화를 의미하지 않습니다.",
                List.of(
                        new ReportSectionDto("수익률", "post 누적 " + metrics.postReturnPct() + "%, train 누적 " + metrics.trainReturnPct() + "%"),
                        new ReportSectionDto("거래", "post " + metrics.postTradeCount() + "건, train " + metrics.trainTradeCount() + "건"),
                        new ReportSectionDto("주의", "runtime_ready=false package shell 입니다.")
                ),
                List.of(),
                packageFeedback(vo)
        );
    }

    private LiveQuantModelSummaryDto toSummary(QuantModelPackageRegistryVo item) {
        PackageMetrics metrics = metrics(item);
        BigDecimal seedMoney = normalizedSeedMoney(item.getSeedMoney());
        BigDecimal totalReturnPct = metrics.postReturnPct();
        BigDecimal totalProfit = seedMoney.multiply(totalReturnPct).divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP);
        BigDecimal monthlyReturnPct = metrics.postMonthlyReturnPct(item.getExpectedMonthlyReturnPct());
        int tradeCount = metrics.postTradeCount();

        return new LiveQuantModelSummaryDto(
                item.getModelCode(),
                item.getModelVersion(),
                item.getPackagePath(),
                item.getModelName(),
                item.getCategory() == null || item.getCategory().isBlank() ? "기타" : item.getCategory(),
                Boolean.TRUE.equals(item.getRuntimeReady()) ? "RUNNING" : "PACKAGE_READY",
                seedMoney,
                totalReturnPct,
                totalProfit,
                monthlyReturnPct,
                0,
                tradeCount,
                tradeCount,
                item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString()
        );
    }

    private List<LiveQuantCandidateDto> packageCandidates(QuantModelPackageRegistryVo vo) {
        PackageMetrics metrics = metrics(vo);
        List<PackageTradeRow> tradeRows = packageTradeRows(vo, metrics);
        if (!tradeRows.isEmpty()) {
            return tradeRows.stream()
                    .sorted(Comparator.comparing(PackageTradeRow::entryDate).reversed())
                    .map(row -> new LiveQuantCandidateDto(
                            row.assetCode(),
                            row.assetName(),
                            row.entryDate(),
                            "HISTORICAL_VALIDATION",
                            row.period().toUpperCase(),
                            "%s %s 진입, %s 청산, 수익률 %s%%".formatted(row.entryDate(), row.reason(), row.exitDate(), row.returnPct()),
                            entryPrice(row),
                            row.returnPct()
                    ))
                    .toList();
        }
        List<LiveQuantCandidateDto> candidates = new ArrayList<>();
        if (metrics.trainTradeCount() > 0) {
            candidates.add(candidate(vo, "TRAIN", "train", metrics.trainReturnPct(), metrics.trainTradeCount(), metrics.trainStart(), metrics.trainEnd()));
        }
        if (metrics.postTradeCount() > 0) {
            candidates.add(candidate(vo, "POST", "post", metrics.postReturnPct(), metrics.postTradeCount(), metrics.postStart(), metrics.postEnd()));
        }
        if (candidates.isEmpty()) {
            candidates.add(new LiveQuantCandidateDto(
                    vo.getModelCode(),
                    vo.getModelName(),
                    metrics.postEnd(),
                    "HISTORICAL_VALIDATION",
                    "WATCH_ONLY",
                    metrics.watchSummary(),
                    null,
                    BigDecimal.ZERO
            ));
        }
        return candidates;
    }

    private LiveQuantCandidateDto candidate(
            QuantModelPackageRegistryVo vo,
            String assetCode,
            String period,
            BigDecimal returnPct,
            int tradeCount,
            String startDate,
            String endDate
    ) {
        return new LiveQuantCandidateDto(
                assetCode,
                vo.getModelName() + " " + period + " 검증",
                endDate,
                "HISTORICAL_VALIDATION",
                "BACKTEST_SUMMARY",
                "%s 과거 데이터 %s~%s, 거래 %d건, 누적 수익률 %s%%".formatted(vo.getModelName(), startDate, endDate, tradeCount, returnPct),
                null,
                returnPct
        );
    }

    private List<LiveQuantTradeDto> packageTrades(QuantModelPackageRegistryVo vo) {
        PackageMetrics metrics = metrics(vo);
        List<PackageTradeRow> tradeRows = packageTradeRows(vo, metrics);
        if (!tradeRows.isEmpty()) {
            return tradeRows.stream()
                    .sorted(Comparator.comparing(PackageTradeRow::exitDate).reversed())
                    .map(row -> trade(row))
                    .toList();
        }
        List<LiveQuantTradeDto> trades = new ArrayList<>();
        if (metrics.trainTradeCount() > 0) {
            trades.add(trade(1L, "TRAIN", vo.getModelName() + " train 검증", metrics.trainEnd(), metrics.trainReturnPct(), metrics.trainTradeCount()));
        }
        if (metrics.postTradeCount() > 0) {
            trades.add(trade(2L, "POST", vo.getModelName() + " post 검증", metrics.postEnd(), metrics.postReturnPct(), metrics.postTradeCount()));
        }
        if (trades.isEmpty()) {
            trades.add(new LiveQuantTradeDto(
                    1L,
                    vo.getModelCode(),
                    vo.getModelName() + " 국면 검증",
                    "REGIME",
                    metrics.postEnd() + "T15:20:00",
                    null,
                    null,
                    null,
                    "HISTORICAL_REGIME_SNAPSHOT",
                    BigDecimal.ZERO,
                    null,
                    metrics.watchSummary()
            ));
        }
        return trades;
    }

    private LiveQuantTradeDto trade(Long id, String assetCode, String assetName, String date, BigDecimal returnPct, int tradeCount) {
        return new LiveQuantTradeDto(
                id,
                assetCode,
                assetName,
                "BACKTEST",
                date + "T15:20:00",
                null,
                null,
                null,
                "PACKAGE_VALIDATION_METRICS",
                BigDecimal.ZERO,
                returnPct,
                "과거 데이터 검증 집계 거래 " + tradeCount + "건"
        );
    }

    private LiveQuantTradeDto trade(PackageTradeRow row) {
        BigDecimal entryPrice = entryPrice(row);
        BigDecimal exitPrice = exitPrice(row);
        return new LiveQuantTradeDto(
                row.id(),
                row.assetCode(),
                row.assetName(),
                "BACKTEST",
                row.exitDate() + "T15:20:00",
                entryPrice,
                exitPrice,
                exitPrice,
                "PACKAGE_VALIDATION_TRADES_CSV",
                BigDecimal.ZERO,
                row.returnPct(),
                "진입 " + row.entryDate() + ", 청산 " + row.exitDate() + ", 사유 " + row.reason()
        );
    }

    private BigDecimal entryPrice(PackageTradeRow row) {
        BigDecimal direct = price(row.assetCode(), row.entryDate());
        if (direct != null) {
            return direct;
        }
        BigDecimal exitPrice = price(row.assetCode(), row.exitDate());
        if (exitPrice == null) {
            return null;
        }
        BigDecimal multiplier = BigDecimal.ONE.add(row.returnPct().divide(ONE_HUNDRED, 10, RoundingMode.HALF_UP));
        if (multiplier.signum() == 0) {
            return null;
        }
        return exitPrice.divide(multiplier, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal exitPrice(PackageTradeRow row) {
        BigDecimal direct = price(row.assetCode(), row.exitDate());
        if (direct != null) {
            return direct;
        }
        BigDecimal entryPrice = price(row.assetCode(), row.entryDate());
        if (entryPrice == null) {
            return null;
        }
        BigDecimal multiplier = BigDecimal.ONE.add(row.returnPct().divide(ONE_HUNDRED, 10, RoundingMode.HALF_UP));
        return entryPrice.multiply(multiplier).setScale(4, RoundingMode.HALF_UP);
    }

    private List<PackageTradeRow> packageTradeRows(QuantModelPackageRegistryVo vo, PackageMetrics metrics) {
        Path tradesPath = packageRoot.resolve(vo.getModelCode()).resolve("artifacts").resolve("trades.csv");
        if (!Files.exists(tradesPath)) {
            return List.of();
        }
        String selectedVariant = metrics.selectedVariant();
        if (selectedVariant.isBlank()) {
            return List.of();
        }
        try {
            List<String> lines = Files.readAllLines(tradesPath, StandardCharsets.UTF_8);
            if (lines.size() < 2) {
                return List.of();
            }
            Map<String, Integer> header = csvHeader(lines.get(0));
            List<PackageTradeRow> rows = new ArrayList<>();
            long id = 1L;
            for (int index = 1; index < lines.size(); index++) {
                String line = lines.get(index);
                if (line.isBlank()) {
                    continue;
                }
                List<String> fields = csvFields(line);
                String variant = field(fields, header, "variant");
                String period = field(fields, header, "period");
                if (!selectedVariant.equals(variant) || !("train".equals(period) || "post".equals(period))) {
                    continue;
                }
                String assetCode = field(fields, header, "asset_code");
                String assetName = field(fields, header, "asset_name");
                String entryDate = field(fields, header, "entry_date");
                String exitDate = field(fields, header, "exit_date");
                if (assetCode.isBlank() || entryDate.isBlank() || exitDate.isBlank()) {
                    continue;
                }
                rows.add(new PackageTradeRow(
                        id++,
                        period,
                        assetCode,
                        assetName.isBlank() ? assetCode : assetName,
                        entryDate,
                        exitDate,
                        decimal(field(fields, header, "ret")).multiply(ONE_HUNDRED),
                        field(fields, header, "reason")
                ));
            }
            return rows;
        } catch (IOException e) {
            return List.of();
        }
    }

    private BigDecimal price(String assetCode, String tradeDate) {
        if (priceMapper == null || assetCode == null || assetCode.isBlank() || tradeDate == null || tradeDate.isBlank()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(tradeDate);
            return priceMapper.findByCodeAndDateRange(assetCode, "STOCK", date, date).stream()
                    .map(MarketDailyPriceVo::getClosePrice)
                    .filter(value -> value != null && value.signum() > 0)
                    .findFirst()
                    .orElse(null);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private Map<String, Integer> csvHeader(String headerLine) {
        List<String> fields = csvFields(headerLine);
        Map<String, Integer> header = new HashMap<>();
        for (int i = 0; i < fields.size(); i++) {
            header.put(fields.get(i).replace("\uFEFF", ""), i);
        }
        return header;
    }

    private List<String> csvFields(String line) {
        return List.of(line.split(",", -1));
    }

    private String field(List<String> fields, Map<String, Integer> header, String name) {
        Integer index = header.get(name);
        return index == null || index >= fields.size() ? "" : fields.get(index).trim();
    }

    private BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private List<LearningFeedbackDto> packageFeedback(QuantModelPackageRegistryVo vo) {
        PackageMetrics metrics = metrics(vo);
        return List.of(new LearningFeedbackDto(
                vo.getModelCode(),
                "PACKAGE_VALIDATION",
                "post cumulative return " + metrics.postReturnPct() + "% from package metrics.",
                "runtime_ready=false 상태이므로 과거 검증/화면 노출용으로만 사용합니다.",
                "PACKAGE_METRICS"
        ));
    }

    private LiveQuantReportSummaryDto packageReport(QuantModelPackageRegistryVo vo) {
        PackageMetrics metrics = metrics(vo);
        return new LiveQuantReportSummaryDto(
                packageReportId(vo.getModelCode()),
                metrics.postEnd(),
                "VALIDATION",
                vo.getModelCode(),
                vo.getModelName() + " 과거 검증 리포트",
                metrics.postReturnPct(),
                metrics.postTradeCount(),
                metrics.postTradeCount(),
                metrics.warningCount(),
                metrics.postEnd() + "T15:45:00"
        );
    }

    private Long packageReportId(String modelCode) {
        return Long.parseLong("88" + Math.abs(modelCode.hashCode()));
    }

    private QuantModelPackageRegistryVo requirePublicVisible(String modelCode) {
        QuantModelPackageRegistryVo vo = mapper.findByCode(modelCode);
        if (vo == null || !Boolean.TRUE.equals(vo.getPublicVisible())) {
            throw new IllegalArgumentException("Unknown visible quant package model: " + modelCode);
        }
        return vo;
    }

    private BigDecimal normalizedSeedMoney(BigDecimal seedMoney) {
        return seedMoney == null || seedMoney.signum() <= 0 ? DEFAULT_SEED_MONEY : seedMoney;
    }

    private PackageMetrics metrics(QuantModelPackageRegistryVo vo) {
        Path metricsPath = packageRoot.resolve(vo.getModelCode()).resolve("artifacts").resolve("metrics.json");
        if (!java.nio.file.Files.exists(metricsPath)) {
            return PackageMetrics.empty();
        }
        try {
            JsonNode root = objectMapper.readTree(metricsPath.toFile());
            return new PackageMetrics(root);
        } catch (IOException e) {
            return PackageMetrics.empty();
        }
    }

    private record PackageTradeRow(
            Long id,
            String period,
            String assetCode,
            String assetName,
            String entryDate,
            String exitDate,
            BigDecimal returnPct,
            String reason
    ) {
    }

    private record PackageMetrics(JsonNode root) {
        static PackageMetrics empty() {
            return new PackageMetrics(null);
        }

        String selectedVariant() {
            return textAt("/sourceCandidate/selectedVariant", "");
        }

        BigDecimal trainReturnPct() {
            return decimalAt("/metrics/train/cumulativeReturnPct");
        }

        BigDecimal postReturnPct() {
            return decimalAt("/metrics/post/cumulativeReturnPct");
        }

        BigDecimal postMonthlyReturnPct(BigDecimal fallback) {
            BigDecimal value = decimalAt("/metrics/post/activeMonthAvgReturnPct");
            if (value.signum() != 0) {
                return value;
            }
            return fallback == null ? BigDecimal.ZERO : fallback;
        }

        int trainTradeCount() {
            return intAt("/metrics/train/tradeCount");
        }

        int postTradeCount() {
            return intAt("/metrics/post/tradeCount");
        }

        int warningCount() {
            return intAt("/metrics/warningCount");
        }

        String trainStart() {
            return textAt("/validation/dateRange/trainFrom", LocalDate.now().withDayOfYear(1).toString());
        }

        String trainEnd() {
            return textAt("/validation/dateRange/trainTo", LocalDate.now().toString());
        }

        String postStart() {
            return textAt("/validation/dateRange/postFrom", textAt("/historicalRegimeSnapshot/periodStart", LocalDate.now().withDayOfYear(1).toString()));
        }

        String postEnd() {
            return textAt("/validation/dateRange/postTo", textAt("/historicalRegimeSnapshot/periodEnd", LocalDate.now().toString()));
        }

        String watchSummary() {
            BigDecimal bull = decimalAt("/historicalRegimeSnapshot/combinedRegimeDistributionPct/BULL");
            BigDecimal side = decimalAt("/historicalRegimeSnapshot/combinedRegimeDistributionPct/SIDEWAYS");
            BigDecimal bear = decimalAt("/historicalRegimeSnapshot/combinedRegimeDistributionPct/BEAR");
            if (bull.signum() == 0 && side.signum() == 0 && bear.signum() == 0) {
                return "전달된 package metrics 기준 검증 요약입니다.";
            }
            return "과거 국면 분포 BULL %s%%, SIDEWAYS %s%%, BEAR %s%%".formatted(bull, side, bear);
        }

        private BigDecimal decimalAt(String pointer) {
            if (root == null) {
                return BigDecimal.ZERO;
            }
            JsonNode node = root.at(pointer);
            if (node.isMissingNode() || node.isNull()) {
                return BigDecimal.ZERO;
            }
            if (node.isNumber()) {
                return node.decimalValue();
            }
            try {
                return new BigDecimal(node.asText());
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }

        private int intAt(String pointer) {
            if (root == null) {
                return 0;
            }
            JsonNode node = root.at(pointer);
            return node.isNumber() ? node.asInt() : 0;
        }

        private String textAt(String pointer, String fallback) {
            if (root == null) {
                return fallback;
            }
            JsonNode node = root.at(pointer);
            return node.isMissingNode() || node.isNull() || node.asText().isBlank() ? fallback : node.asText();
        }
    }

    private QuantModelPackageRegistryVo toVo(QuantModelPackageSpec spec) {
        QuantModelPackageRegistryVo vo = new QuantModelPackageRegistryVo();
        vo.setModelCode(spec.modelCode());
        vo.setModelName(spec.modelName());
        vo.setModelVersion(spec.modelVersion());
        vo.setCategory(spec.category());
        vo.setDescription(spec.description());
        vo.setPackagePath(spec.packagePath());
        vo.setSeedMoney(spec.seedMoney());
        vo.setExpectedMonthlyReturnPct(spec.expectedMonthlyReturnPct());
        return vo;
    }

    private QuantModelPackageDto toDto(QuantModelPackageRegistryVo vo) {
        return new QuantModelPackageDto(
                vo.getModelCode(),
                vo.getModelName(),
                vo.getModelVersion(),
                vo.getCategory(),
                vo.getDescription(),
                vo.getPackagePath(),
                vo.getPackageStatus(),
                Boolean.TRUE.equals(vo.getPublicVisible()),
                Boolean.TRUE.equals(vo.getRuntimeReady()),
                vo.getAdminNote(),
                vo.getDiscoveredAt(),
                vo.getUpdatedAt()
        );
    }
}
