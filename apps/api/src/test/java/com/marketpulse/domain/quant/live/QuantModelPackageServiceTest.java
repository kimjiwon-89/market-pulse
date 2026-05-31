package com.marketpulse.domain.quant.live;

import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.LiveQuantModelDetailDto;
import com.marketpulse.domain.quant.live.service.QuantModelPackageScanner;
import com.marketpulse.domain.quant.live.service.QuantModelPackageService;
import com.marketpulse.domain.quant.mapper.QuantModelPackageRegistryMapper;
import com.marketpulse.domain.quant.vo.QuantModelPackageRegistryVo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class QuantModelPackageServiceTest {
    @TempDir
    Path tempDir;

    @Test
    void publicVisibleSummariesKeepPackageCategoryForScreenFilters() {
        QuantModelPackageRegistryVo legacyBull = new QuantModelPackageRegistryVo();
        legacyBull.setModelCode("BULL_V4");
        legacyBull.setModelName("Bull v4 모델");
        legacyBull.setModelVersion("5.0.1");
        legacyBull.setCategory("상승장");
        legacyBull.setPackagePath("domains/quant-serving/packages/BULL_V4");
        legacyBull.setPublicVisible(true);
        legacyBull.setRuntimeReady(false);
        legacyBull.setSeedMoney(new BigDecimal("100000000"));

        QuantModelPackageRegistryVo watchPackage = new QuantModelPackageRegistryVo();
        watchPackage.setModelCode("KOSPI_WATCH");
        watchPackage.setModelName("KOSPI Watch");
        watchPackage.setModelVersion("0.1.0");
        watchPackage.setCategory("기타");
        watchPackage.setPackagePath("domains/quant-serving/packages/KOSPI_WATCH");
        watchPackage.setRuntimeReady(false);
        watchPackage.setSeedMoney(new BigDecimal("100000000"));
        watchPackage.setExpectedMonthlyReturnPct(BigDecimal.ZERO);

        QuantModelPackageService service = new QuantModelPackageService(
                new QuantModelPackageScanner(new com.fasterxml.jackson.databind.ObjectMapper()),
                new FakePackageRegistryMapper(List.of(legacyBull, watchPackage)),
                "unused"
        );

        List<LiveQuantModelSummaryDto> summaries = service.publicVisibleSummaries();

        assertThat(summaries).singleElement().satisfies(summary -> {
            assertThat(summary.modelCode()).isEqualTo("KOSPI_WATCH");
            assertThat(summary.status()).isEqualTo("PACKAGE_READY");
            assertThat(summary.category()).isEqualTo("기타");
            assertThat(summary.seedMoney()).isEqualByComparingTo("100000000");
        });
    }

    @Test
    void publicVisiblePackageDetailUsesMetricsForReturnAndTradeRows() throws Exception {
        Path packageDir = tempDir.resolve("KOSPI_BULL");
        Files.createDirectories(packageDir.resolve("artifacts"));
        Files.writeString(packageDir.resolve("artifacts/metrics.json"), """
                {
                  "metrics": {
                    "train": {"cumulativeReturnPct": 39.18, "tradeCount": 29},
                    "post": {"cumulativeReturnPct": 81.87, "activeMonthAvgReturnPct": 4.78, "tradeCount": 10},
                    "warningCount": 3
                  },
                  "validation": {
                    "dateRange": {
                      "trainFrom": "2022-05-01",
                      "trainTo": "2025-07-31",
                      "postFrom": "2025-08-01",
                      "postTo": "2026-05-20"
                    }
                  }
                }
                """);

        QuantModelPackageRegistryVo kospiBull = new QuantModelPackageRegistryVo();
        kospiBull.setModelCode("KOSPI_BULL");
        kospiBull.setModelName("KOSPI Bull v1");
        kospiBull.setModelVersion("1.0.0");
        kospiBull.setCategory("상승장");
        kospiBull.setPackagePath("domains/quant-serving/packages/KOSPI_BULL");
        kospiBull.setPublicVisible(true);
        kospiBull.setRuntimeReady(false);
        kospiBull.setSeedMoney(new BigDecimal("100000000"));
        kospiBull.setExpectedMonthlyReturnPct(BigDecimal.ZERO);

        QuantModelPackageService service = new QuantModelPackageService(
                new QuantModelPackageScanner(new com.fasterxml.jackson.databind.ObjectMapper()),
                new FakePackageRegistryMapper(List.of(kospiBull)),
                tempDir.toString()
        );

        LiveQuantModelDetailDto detail = service.publicVisibleDetail("KOSPI_BULL");

        assertThat(detail.summary().modelName()).isEqualTo("KOSPI Bull v1");
        assertThat(detail.summary().seedMoney()).isEqualByComparingTo("100000000");
        assertThat(detail.summary().totalReturnPct()).isEqualByComparingTo("81.87");
        assertThat(detail.summary().monthlyReturnPct()).isEqualByComparingTo("4.78");
        assertThat(detail.trades()).extracting("assetCode").containsExactly("TRAIN", "POST");
        assertThat(detail.trades()).extracting("realizedReturnPct")
                .containsExactly(new BigDecimal("39.18"), new BigDecimal("81.87"));
        assertThat(detail.candidates()).extracting("assetName")
                .containsExactly("KOSPI Bull v1 train 검증", "KOSPI Bull v1 post 검증");
    }

    private record FakePackageRegistryMapper(List<QuantModelPackageRegistryVo> packages)
            implements QuantModelPackageRegistryMapper {
        @Override
        public List<QuantModelPackageRegistryVo> findAll() {
            return packages;
        }

        @Override
        public List<QuantModelPackageRegistryVo> findPublicVisible() {
            return packages;
        }

        @Override
        public QuantModelPackageRegistryVo findByCode(String modelCode) {
            return packages.stream()
                    .filter(item -> item.getModelCode().equals(modelCode))
                    .findFirst()
                    .orElse(null);
        }

        @Override
        public void upsertDetected(QuantModelPackageRegistryVo vo) {
        }

        @Override
        public int updateVisibility(String modelCode, boolean publicVisible, String packageStatus, String adminNote) {
            return 0;
        }
    }
}
