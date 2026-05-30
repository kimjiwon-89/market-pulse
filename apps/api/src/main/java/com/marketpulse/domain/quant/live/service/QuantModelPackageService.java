package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.LiveQuantModelSummaryDto;
import com.marketpulse.domain.quant.live.dto.QuantModelPackageDto;
import com.marketpulse.domain.quant.live.dto.QuantModelPackageVisibilityRequest;
import com.marketpulse.domain.quant.mapper.QuantModelPackageRegistryMapper;
import com.marketpulse.domain.quant.vo.QuantModelPackageRegistryVo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.List;

@Service
public class QuantModelPackageService {
    private final QuantModelPackageScanner scanner;
    private final QuantModelPackageRegistryMapper mapper;
    private final Path packageRoot;

    public QuantModelPackageService(
            QuantModelPackageScanner scanner,
            QuantModelPackageRegistryMapper mapper,
            @Value("${market-pulse.quant.package-root:../../domains/quant-serving/packages}") String packageRoot) {
        this.scanner = scanner;
        this.mapper = mapper;
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
                .map(item -> new LiveQuantModelSummaryDto(
                        item.getModelCode(),
                        item.getModelVersion(),
                        item.getPackagePath(),
                        item.getModelName(),
                        item.getRuntimeReady() ? "RUNNING" : "PACKAGE_READY",
                        item.getSeedMoney() == null ? BigDecimal.ZERO : item.getSeedMoney(),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        item.getExpectedMonthlyReturnPct() == null ? BigDecimal.ZERO : item.getExpectedMonthlyReturnPct(),
                        0,
                        0,
                        0,
                        item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString()
                ))
                .toList();
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
