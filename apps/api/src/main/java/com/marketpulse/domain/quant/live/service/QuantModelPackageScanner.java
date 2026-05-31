package com.marketpulse.domain.quant.live.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Component
public class QuantModelPackageScanner {
    private final ObjectMapper objectMapper;

    public QuantModelPackageScanner(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<QuantModelPackageSpec> scan(Path packageRoot) {
        if (packageRoot == null || !Files.isDirectory(packageRoot)) {
            return List.of();
        }

        try (Stream<Path> entries = Files.list(packageRoot)) {
            return entries
                    .filter(Files::isDirectory)
                    .map(path -> path.resolve("manifest.json"))
                    .filter(Files::isRegularFile)
                    .map(this::readManifest)
                    .sorted(Comparator.comparing(QuantModelPackageSpec::modelCode))
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to scan quant model package root: " + packageRoot, e);
        }
    }

    private QuantModelPackageSpec readManifest(Path manifestPath) {
        try {
            JsonNode json = objectMapper.readTree(manifestPath.toFile());
            String modelCode = requiredText(json, "modelCode").toUpperCase(Locale.ROOT);
            String modelName = text(json, "modelName", modelCode);
            String modelVersion = text(json, "modelVersion", "0.0.0");
            String category = text(json, "category", "기타");
            String description = text(json, "description", "패키지로 전달된 quant 모델입니다.");
            return new QuantModelPackageSpec(
                    modelCode,
                    modelName,
                    modelVersion,
                    category,
                    description,
                    manifestPath.getParent().toString(),
                    decimal(json, "seedMoney", "0"),
                    decimal(json, "expectedMonthlyReturnPct", "0")
            );
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read quant model package manifest: " + manifestPath, e);
        }
    }

    private String requiredText(JsonNode json, String field) {
        String value = text(json, field, null);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Package manifest is missing required field: " + field);
        }
        return value;
    }

    private String text(JsonNode json, String field, String fallback) {
        JsonNode value = json.get(field);
        if (value == null || value.isNull()) return fallback;
        String text = value.asText();
        return text == null || text.isBlank() ? fallback : text;
    }

    private BigDecimal decimal(JsonNode json, String field, String fallback) {
        JsonNode value = json.get(field);
        if (value == null || value.isNull()) return new BigDecimal(fallback);
        return new BigDecimal(value.asText());
    }
}
