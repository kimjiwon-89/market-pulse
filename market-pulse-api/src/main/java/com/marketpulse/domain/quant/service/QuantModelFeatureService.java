package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.QuantCoreFeatureSnapshotDto;
import com.marketpulse.domain.quant.dto.QuantFeatureGenerateResponse;
import com.marketpulse.domain.quant.mapper.QuantCoreFeatureSnapshotMapper;
import com.marketpulse.domain.quant.mapper.QuantModelDefinitionMapper;
import com.marketpulse.domain.quant.model.QuantFeatureGenerator;
import com.marketpulse.domain.quant.vo.QuantCoreFeatureSnapshotVo;
import com.marketpulse.domain.quant.vo.QuantModelDefinitionVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuantModelFeatureService {
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final QuantModelDefinitionMapper modelMapper;
    private final QuantCoreFeatureSnapshotMapper featureMapper;
    private final List<QuantFeatureGenerator> featureGenerators;
    private final ObjectMapper objectMapper;

    @Transactional
    public QuantFeatureGenerateResponse generate(String modelCode, String from, String to) {
        QuantModelDefinitionVo model = requireModel(modelCode);
        QuantFeatureGenerator generator = generatorMap().get(model.getImplementationKey());
        if (generator == null) {
            throw new IllegalArgumentException("실행 가능한 feature generator가 없는 모델입니다: " + model.getModelCode());
        }

        LocalDate fromDate = parseDate(from);
        LocalDate toDate = parseDate(to);
        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("to는 from보다 빠를 수 없습니다.");
        }

        int generated = generator.generateFeatures(model.getModelCode(), fromDate, toDate);
        return new QuantFeatureGenerateResponse(model.getModelCode(), fromDate.toString(), toDate.toString(), generated);
    }

    public List<QuantCoreFeatureSnapshotDto> list(String modelCode, String date, int limit) {
        QuantModelDefinitionVo model = requireModel(modelCode);
        LocalDate signalDate = parseDate(date);
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return featureMapper.findByModelAndDate(model.getModelCode(), signalDate, safeLimit).stream()
                .map(this::toDto)
                .toList();
    }

    private QuantModelDefinitionVo requireModel(String modelCode) {
        QuantModelDefinitionVo model = modelMapper.findByCode(normalizeCode(modelCode));
        if (model == null || !Boolean.TRUE.equals(model.getIsActive())) {
            throw new IllegalArgumentException("활성 모델을 찾을 수 없습니다: " + modelCode);
        }
        return model;
    }

    private Map<String, QuantFeatureGenerator> generatorMap() {
        return featureGenerators.stream()
                .collect(Collectors.toMap(QuantFeatureGenerator::implementationKey, Function.identity(), (a, b) -> a));
    }

    private QuantCoreFeatureSnapshotDto toDto(QuantCoreFeatureSnapshotVo vo) {
        return new QuantCoreFeatureSnapshotDto(
                vo.getId(),
                vo.getModelCode(),
                vo.getSignalDate(),
                vo.getAssetCode(),
                vo.getAssetName(),
                vo.getMarket(),
                vo.getSector(),
                parseJson(vo.getFeatures()),
                parseJson(vo.getPreprocessingMeta()),
                vo.getLabel(),
                vo.getForwardReturn(),
                vo.getBenchmarkReturn()
        );
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("날짜는 필수입니다.");
        }
        String trimmed = value.trim();
        return trimmed.contains("-") ? LocalDate.parse(trimmed) : LocalDate.parse(trimmed, BASIC_DATE);
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
