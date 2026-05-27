package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.quant.live.dto.LiveQuantModelDetailDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportDetailDto;
import com.marketpulse.domain.quant.live.dto.WatchedAssetDto;
import com.marketpulse.domain.quant.live.service.HistoricalReplayProvider;
import com.marketpulse.domain.quant.live.service.LiveQuantSimulationService;
import com.marketpulse.domain.quant.live.service.ReplayTradeFact;
import com.marketpulse.domain.quant.live.service.RuleBasedReportWriter;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LiveQuantSimulationServiceTest {

    private final LiveQuantSimulationService service = new LiveQuantSimulationService(
            new RuleBasedReportWriter(),
            assetCode -> java.util.Optional.of(switch (assetCode) {
                case "005930" -> new BigDecimal("312000");
                case "000660" -> new BigDecimal("184500");
                case "035420" -> new BigDecimal("216000");
                case "068270" -> new BigDecimal("192000");
                default -> BigDecimal.ZERO;
            }),
            new FakeReplayProvider()
    );

    @Test
    void visibleModelsExcludeMasterAndUseIndependentSeedMoney() {
        List<LiveQuantModelSummaryDto> models = service.getVisibleModels();

        assertThat(models).extracting(LiveQuantModelSummaryDto::modelCode)
                .containsExactly("INDEX_REGIME", "BULL_V4", "SIDEWAYS_MODEL", "BEAR_MODEL");
        assertThat(models)
                .filteredOn(model -> model.modelCode().equals("BULL_V4"))
                .singleElement()
                .satisfies(model -> {
                    assertThat(model.modelVersion()).isEqualTo("5.0.0");
                    assertThat(model.configKey()).isEqualTo("BULL_V4_5_0_0_BALANCED_PAPER");
                });
        assertThat(models).extracting(LiveQuantModelSummaryDto::modelCode)
                .doesNotContain("MASTER_MODEL");
        assertThat(models).allSatisfy(model ->
                assertThat(model.seedMoney()).isEqualByComparingTo(new BigDecimal("1000000000")));
        assertThat(models)
                .filteredOn(model -> !model.modelCode().equals("BULL_V4"))
                .allSatisfy(model -> {
                    assertThat(model.status()).isEqualTo("SERVICE_PREPARING");
                    assertThat(model.rawCandidateCountToday()).isZero();
                    assertThat(model.actualEntryCountToday()).isZero();
                    assertThat(model.openPositionCount()).isZero();
                });
    }

    @Test
    void bullModelIsDataDelayedWhenFrozenReplayHasNoFacts() {
        LiveQuantSimulationService emptyReplayService = new LiveQuantSimulationService(
                new RuleBasedReportWriter(),
                assetCode -> java.util.Optional.of(new BigDecimal("312000")),
                (fromDate, toDate) -> List.of()
        );

        assertThat(emptyReplayService.getVisibleModels())
                .filteredOn(model -> model.modelCode().equals("BULL_V4"))
                .singleElement()
                .satisfies(model -> {
                    assertThat(model.status()).isEqualTo("DATA_DELAYED");
                    assertThat(model.actualEntryCountToday()).isZero();
                });
    }

    @Test
    void modelsExposeHistoricalReplayWatchedAssets() {
        List<WatchedAssetDto> watchedAssets = service.getWatchedAssets("BULL_V4", "20260527");

        assertThat(watchedAssets).extracting(WatchedAssetDto::assetCode)
                .contains("111111", "222222");
        assertThat(watchedAssets).allSatisfy(asset ->
                assertThat(asset.trackingSource()).isEqualTo("BULL_V4_5_0_0_REPLAY_BALANCED_PAPER"));
    }

    @Test
    void reportContainsDeterministicCheckpointAnalysisWithoutAi() {
        LiveQuantReportDetailDto report = service.getReport(20260527L);

        assertThat(report.generatedBy()).isEqualTo("RULE_BASED_TEMPLATE");
        assertThat(report.checkpointAnalyses()).isNotEmpty();
        assertThat(report.summaryText()).contains("stored model facts");
    }

    @Test
    void reportContainsTemplateSectionsFromModelFacts() {
        LiveQuantReportDetailDto report = service.getReport(20260527L);

        assertThat(report.sections()).extracting(section -> section.title())
                .contains(
                        "Raw 후보",
                        "실제 Entry 후보",
                        "진입/미진입 사유",
                        "보유 종목 변화",
                        "청산 조건 변화",
                        "예상 수익률",
                        "위험 플래그",
                        "내일 관찰 포인트"
                );
        assertThat(report.sections()).allSatisfy(section -> assertThat(section.body()).isNotBlank());
    }

    @Test
    void modelExposesHistoricalReplayTradesAndCandidates() {
        LiveQuantModelDetailDto detail = service.getModelDetail("BULL_V4");

        assertThat(detail.positions()).isEmpty();
        assertThat(detail.trades()).hasSize(4);
        assertThat(detail.candidates()).extracting(candidate -> candidate.assetCode())
                .contains("111111", "222222");
        assertThat(detail.summary().totalReturnPct()).isGreaterThan(BigDecimal.ZERO);
        assertThat(detail.summary().latestReportTime()).isNotNull();
    }

    @Test
    void reportsExposeWeeklyHistoryAndMayDailyHistoryOnly() {
        assertThat(service.getReports("WEEKLY", null)).isNotEmpty();
        assertThat(service.getReports("DAILY", null))
                .allSatisfy(report -> assertThat(report.reportDate()).startsWith("202605"));
    }

    @Test
    void weeklyReportDetailKeepsWeeklyPeriod() {
        LiveQuantReportDetailDto report = service.getReport(90202622L);

        assertThat(report.period()).isEqualTo("WEEKLY");
        assertThat(report.title()).contains("weekly");
    }

    private static class FakeReplayProvider implements HistoricalReplayProvider {
        @Override
        public List<ReplayTradeFact> bullV4ReplayFacts(LocalDate fromDate, LocalDate toDate) {
            return List.of(
                    new ReplayTradeFact(
                            LocalDate.of(2026, 5, 8),
                            LocalDate.of(2026, 5, 20),
                            "111111",
                            "Replay Alpha",
                            new BigDecimal("10000"),
                            new BigDecimal("12000"),
                            new BigDecimal("20.00"),
                            new BigDecimal("0.91"),
                            "BULL_V4_5_0_0_REPLAY_BALANCED_PAPER"
                    ),
                    new ReplayTradeFact(
                            LocalDate.of(2026, 5, 21),
                            LocalDate.of(2026, 5, 27),
                            "222222",
                            "Replay Beta",
                            new BigDecimal("20000"),
                            new BigDecimal("21000"),
                            new BigDecimal("5.00"),
                            new BigDecimal("0.82"),
                            "BULL_V4_5_0_0_REPLAY_BALANCED_PAPER"
                    )
            );
        }
    }
}
