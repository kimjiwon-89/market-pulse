package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.QuantCoreSignalDto;
import com.marketpulse.domain.quant.dto.QuantSignalGenerateResponse;
import com.marketpulse.domain.quant.mapper.QuantCoreFeatureSnapshotMapper;
import com.marketpulse.domain.quant.mapper.QuantCoreSignalMapper;
import com.marketpulse.domain.quant.mapper.QuantModelDefinitionMapper;
import com.marketpulse.domain.quant.vo.QuantCoreSignalVo;
import com.marketpulse.domain.quant.vo.QuantModelDefinitionVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuantModelSignalService {
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final QuantModelDefinitionMapper modelMapper;
    private final QuantCoreSignalMapper signalMapper;
    private final QuantCoreFeatureSnapshotMapper featureMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public QuantSignalGenerateResponse generate(String modelCode, String date, int limit) {
        QuantModelDefinitionVo model = requireModel(modelCode);
        if (model.getImplementationKey() == null || model.getImplementationKey().isBlank()) {
            throw new IllegalArgumentException("실행 가능한 signal engine이 없는 모델입니다: " + model.getModelCode());
        }
        LocalDate signalDate = resolveDate(model.getModelCode(), date);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int generated = signalMapper.generateBaselineSignals(model.getModelCode(), signalDate, safeLimit);
        return new QuantSignalGenerateResponse(model.getModelCode(), signalDate.toString(), generated);
    }

    public List<QuantCoreSignalDto> list(String modelCode, String date, int limit) {
        QuantModelDefinitionVo model = requireModel(modelCode);
        LocalDate signalDate = parseDate(date);
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return signalMapper.findByModelAndDate(model.getModelCode(), signalDate, safeLimit).stream()
                .map(this::toDto)
                .toList();
    }

    private QuantModelDefinitionVo requireModel(String modelCode) {
        QuantModelDefinitionVo model = modelMapper.findByCode(modelCode.trim().toUpperCase());
        if (model == null || !Boolean.TRUE.equals(model.getIsActive())) {
            throw new IllegalArgumentException("활성 모델을 찾을 수 없습니다: " + modelCode);
        }
        return model;
    }

    private QuantCoreSignalDto toDto(QuantCoreSignalVo vo) {
        return new QuantCoreSignalDto(
                vo.getId(),
                vo.getModelCode(),
                vo.getModelVersionId(),
                vo.getSignalDate(),
                vo.getAssetCode(),
                vo.getAssetName(),
                vo.getMarket(),
                vo.getSector(),
                vo.getWinnerProb(),
                vo.getNeutralProb(),
                vo.getLoserProb(),
                vo.getScore(),
                vo.getRank(),
                vo.getTargetWeight(),
                parseJson(vo.getReason()),
                parseJson(vo.getRiskFlags())
        );
    }

    private LocalDate resolveDate(String modelCode, String value) {
        if (value == null || value.isBlank()) {
            LocalDate latest = featureMapper.findLatestFeatureDate(modelCode);
            if (latest == null) {
                throw new IllegalArgumentException("피처 데이터가 없습니다: " + modelCode);
            }
            return latest;
        }
        return parseDate(value);
    }

    private LocalDate parseDate(String value) {
        String trimmed = value.trim();
        return trimmed.contains("-") ? LocalDate.parse(trimmed) : LocalDate.parse(trimmed, BASIC_DATE);
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
