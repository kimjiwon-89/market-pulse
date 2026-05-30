package com.marketpulse.domain.quant.live;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.live.service.QuantModelPackageScanner;
import com.marketpulse.domain.quant.live.service.QuantModelPackageSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class QuantModelPackageScannerTest {

    @TempDir
    Path tempDir;

    @Test
    void scansModelPackageManifestsFromPackageRoot() throws Exception {
        Path packageDir = tempDir.resolve("KOSDAQ_BULL");
        Files.createDirectories(packageDir);
        Files.writeString(packageDir.resolve("manifest.json"), """
                {
                  "modelCode": "KOSDAQ_BULL",
                  "modelName": "KOSDAQ Bull v1",
                  "modelVersion": "1.0.0",
                  "category": "상승장",
                  "description": "KOSDAQ-only bull package",
                  "seedMoney": 100000000,
                  "expectedMonthlyReturnPct": 15.0
                }
                """);

        QuantModelPackageScanner scanner = new QuantModelPackageScanner(new ObjectMapper());

        List<QuantModelPackageSpec> packages = scanner.scan(tempDir);

        assertThat(packages).singleElement().satisfies(item -> {
            assertThat(item.modelCode()).isEqualTo("KOSDAQ_BULL");
            assertThat(item.modelName()).isEqualTo("KOSDAQ Bull v1");
            assertThat(item.modelVersion()).isEqualTo("1.0.0");
            assertThat(item.category()).isEqualTo("상승장");
            assertThat(item.description()).isEqualTo("KOSDAQ-only bull package");
            assertThat(item.packagePath()).isEqualTo(packageDir.toString());
            assertThat(item.seedMoney()).isEqualByComparingTo("100000000");
            assertThat(item.expectedMonthlyReturnPct()).isEqualByComparingTo("15.0");
        });
    }
}
