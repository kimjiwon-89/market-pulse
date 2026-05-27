package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.CheckpointAnalysisDto;
import com.marketpulse.domain.quant.live.dto.LearningFeedbackDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantReportDetailDto;
import com.marketpulse.domain.quant.live.dto.ReportSectionDto;
import com.marketpulse.domain.quant.live.dto.WatchedAssetDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class RuleBasedReportWriter {

    public LiveQuantReportDetailDto dailyReport(Long reportId, String reportDate, String modelCode, List<WatchedAssetDto> watchedAssets) {
        return report(reportId, reportDate, "DAILY", modelCode, watchedAssets);
    }

    public LiveQuantReportDetailDto weeklyReport(Long reportId, String reportDate, String modelCode, List<WatchedAssetDto> watchedAssets) {
        return report(reportId, reportDate, "WEEKLY", modelCode, watchedAssets);
    }

    private LiveQuantReportDetailDto report(Long reportId, String reportDate, String period, String modelCode, List<WatchedAssetDto> watchedAssets) {
        String label = period.toLowerCase(java.util.Locale.ROOT);
        if (watchedAssets.isEmpty()) {
            return new LiveQuantReportDetailDto(
                    reportId,
                    reportDate,
                    period,
                    modelCode,
                    modelCode + " deterministic " + label + " report",
                    "RULE_BASED_TEMPLATE",
                    "No completed live model facts are available yet. Reports will be generated after real model decisions and outcome checkpoints are stored.",
                    emptySections(),
                    List.of(),
                    List.of());
        }

        List<CheckpointAnalysisDto> analyses = watchedAssets.stream()
                .flatMap(asset -> asset.checkpoints().stream()
                        .map(checkpoint -> new CheckpointAnalysisDto(
                                modelCode,
                                asset.assetCode(),
                                asset.assetName(),
                                asset.trackingSource(),
                                checkpoint.horizon(),
                                checkpoint.analysisText())))
                .toList();
        List<LearningFeedbackDto> feedback = analyses.stream()
                .filter(analysis -> analysis.analysisText().contains("missed entry") || analysis.analysisText().contains("early exit"))
                .map(analysis -> new LearningFeedbackDto(
                        modelCode,
                        "OUTCOME_CHECKPOINT",
                        analysis.assetName() + " " + analysis.horizon() + " " + analysis.analysisText(),
                        "Review model rule after more repeated evidence is collected.",
                        "CANDIDATE"))
                .toList();
        String summary = modelCode + " " + label + " report generated from stored model facts and outcome checkpoints.";
        List<ReportSectionDto> sections = sections(watchedAssets);
        return new LiveQuantReportDetailDto(
                reportId,
                reportDate,
                period,
                modelCode,
                modelCode + " deterministic " + label + " report",
                "RULE_BASED_TEMPLATE",
                summary,
                sections,
                analyses,
                feedback);
    }

    private List<ReportSectionDto> emptySections() {
        return List.of(
                section("Raw 후보", "아직 집계된 raw 후보가 없습니다."),
                section("실제 Entry 후보", "아직 실제 entry 후보가 없습니다."),
                section("진입/미진입 사유", "모델 판단 로그가 생성되면 진입 및 미진입 사유를 기록합니다."),
                section("보유 종목 변화", "현재 비교 가능한 보유 종목 변화가 없습니다."),
                section("청산 조건 변화", "청산 조건 변화가 아직 없습니다."),
                section("예상 수익률", "예상 수익률은 후보와 체결 데이터가 누적되면 표시합니다."),
                section("위험 플래그", "현재 감지된 위험 플래그가 없습니다."),
                section("내일 관찰 포인트", "다음 장에서 확인할 관찰 포인트가 아직 없습니다.")
        );
    }

    private List<ReportSectionDto> sections(List<WatchedAssetDto> assets) {
        long profitable = assets.stream().filter(asset -> firstReturn(asset).signum() >= 0).count();
        long losing = assets.size() - profitable;
        String topAssets = assets.stream()
                .limit(5)
                .map(asset -> asset.assetName() + "(" + asset.assetCode() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("-");
        String entryAssets = assets.stream()
                .filter(asset -> "REPLAY_CLOSED_TRADE".equals(asset.originalDecisionType()) || asset.trackingSource().contains("REPLAY"))
                .limit(5)
                .map(asset -> asset.assetName() + " " + pct(firstReturn(asset)))
                .reduce((left, right) -> left + ", " + right)
                .orElse("실제 entry로 이어진 후보가 없습니다.");
        BigDecimal averageReturn = averageReturn(assets);
        BigDecimal maxLoss = assets.stream()
                .map(this::firstReturn)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return List.of(
                section("Raw 후보", "총 " + assets.size() + "개 후보를 관찰했습니다. 주요 후보는 " + topAssets + "입니다."),
                section("실제 Entry 후보", entryAssets),
                section("진입/미진입 사유", "entry 후보는 모델 조건을 통과한 종목만 기록했습니다. 미진입 후보는 조건 미충족 사유가 누적되면 별도 분리합니다."),
                section("보유 종목 변화", "리포트 기간 내 청산 완료 " + assets.size() + "건, 수익 청산 " + profitable + "건, 손실 청산 " + losing + "건입니다."),
                section("청산 조건 변화", "청산된 종목은 EXIT 체크포인트로 기록했습니다. 손실 반복 종목은 다음 리밸런싱에서 진입 강도를 낮춰 검토합니다."),
                section("예상 수익률", "리포트 기준 평균 실현/예상 수익률은 " + pct(averageReturn) + "입니다."),
                section("위험 플래그", maxLoss.signum() < 0
                        ? "최대 손실 체크포인트는 " + pct(maxLoss) + "입니다. 동일 패턴 반복 시 stop/trailing 조건을 재검토합니다."
                        : "기간 내 손실 체크포인트가 감지되지 않았습니다."),
                section("내일 관찰 포인트", "오늘 청산/관찰 종목의 1일, 7일, 2주, 1개월, 6개월 후속 흐름을 계속 추적합니다.")
        );
    }

    private ReportSectionDto section(String title, String body) {
        return new ReportSectionDto(title, body);
    }

    private BigDecimal averageReturn(List<WatchedAssetDto> assets) {
        if (assets.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return assets.stream()
                .map(this::firstReturn)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(assets.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal firstReturn(WatchedAssetDto asset) {
        return asset.checkpoints().stream()
                .filter(checkpoint -> checkpoint.forwardReturnPct() != null)
                .findFirst()
                .map(checkpoint -> checkpoint.forwardReturnPct().setScale(2, RoundingMode.HALF_UP))
                .orElse(BigDecimal.ZERO);
    }

    private String pct(BigDecimal value) {
        String sign = value.signum() > 0 ? "+" : "";
        return sign + value.setScale(2, RoundingMode.HALF_UP) + "%";
    }
}
