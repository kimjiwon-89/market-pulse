package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.QuantModelCreateRequest;
import com.marketpulse.domain.quant.dto.QuantModelDto;
import com.marketpulse.domain.quant.dto.QuantModelUpdateRequest;
import com.marketpulse.domain.quant.mapper.QuantModelDefinitionMapper;
import com.marketpulse.domain.quant.model.QuantModelDefinition;
import com.marketpulse.domain.quant.vo.QuantModelDefinitionVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuantModelDefinitionService {
    private static final String CODE_MODEL = "CODE";
    private static final String USER_MODEL = "USER_DEFINED";

    private final QuantModelDefinitionMapper mapper;
    private final List<QuantModelDefinition> codeModels;
    private final ObjectMapper objectMapper;

    public List<QuantModelDto> list(boolean includeInactive) {
        return mapper.findAll(includeInactive).stream()
                .map(this::toDto)
                .toList();
    }

    public QuantModelDto get(Long id) {
        QuantModelDefinitionVo vo = mapper.findById(id);
        if (vo == null) {
            throw new IllegalArgumentException("모델을 찾을 수 없습니다: " + id);
        }
        return toDto(vo);
    }

    @Transactional
    public QuantModelDto create(QuantModelCreateRequest request, String username) {
        String modelCode = normalizeCode(request.modelCode());
        if (mapper.findByCode(modelCode) != null) {
            throw new IllegalArgumentException("이미 존재하는 모델 코드입니다: " + modelCode);
        }

        QuantModelDefinitionVo vo = new QuantModelDefinitionVo();
        vo.setModelCode(modelCode);
        vo.setDisplayName(request.displayName());
        vo.setDescription(request.description());
        vo.setModelType(normalizeUpper(request.modelType()));
        vo.setImplementationKey(blankToNull(request.implementationKey()));
        vo.setImplementationType(resolveImplementationType(vo.getImplementationKey()));
        vo.setConfigSchema(toJson(request.configSchema()));
        vo.setDefaultConfig(toJson(request.defaultConfig()));
        vo.setIsUserDefined(true);
        vo.setIsActive(true);
        vo.setCreatedBy(username);
        mapper.insert(vo);
        return get(vo.getId());
    }

    @Transactional
    public QuantModelDto update(Long id, QuantModelUpdateRequest request) {
        QuantModelDefinitionVo existing = mapper.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("모델을 찾을 수 없습니다: " + id);
        }

        existing.setDisplayName(valueOrExisting(request.displayName(), existing.getDisplayName()));
        existing.setDescription(valueOrExisting(request.description(), existing.getDescription()));
        existing.setModelType(valueOrExisting(normalizeUpper(request.modelType()), existing.getModelType()));
        if (request.implementationKey() != null) {
            existing.setImplementationKey(blankToNull(request.implementationKey()));
            existing.setImplementationType(resolveImplementationType(existing.getImplementationKey()));
        }
        if (request.configSchema() != null) {
            existing.setConfigSchema(toJson(request.configSchema()));
        }
        if (request.defaultConfig() != null) {
            existing.setDefaultConfig(toJson(request.defaultConfig()));
        }
        if (request.isActive() != null) {
            existing.setIsActive(request.isActive());
        }

        mapper.update(existing);
        return get(id);
    }

    @Transactional
    public void deactivate(Long id) {
        if (mapper.deactivate(id) == 0) {
            throw new IllegalArgumentException("모델을 찾을 수 없습니다: " + id);
        }
    }

    @Transactional
    public void seedCodeModels() {
        for (QuantModelDefinition model : codeModels) {
            QuantModelDefinitionVo vo = new QuantModelDefinitionVo();
            vo.setModelCode(model.modelCode());
            vo.setDisplayName(model.displayName());
            vo.setDescription(model.description());
            vo.setModelType(model.modelType());
            vo.setImplementationType(CODE_MODEL);
            vo.setImplementationKey(model.implementationKey());
            vo.setConfigSchema(toJson(model.configSchema()));
            vo.setDefaultConfig(toJson(model.defaultConfig()));
            vo.setIsUserDefined(false);
            vo.setIsActive(true);
            vo.setCreatedBy("SYSTEM");
            mapper.insertIfNotExists(vo);
        }
    }

    private QuantModelDto toDto(QuantModelDefinitionVo vo) {
        return new QuantModelDto(
                vo.getId(),
                vo.getModelCode(),
                vo.getDisplayName(),
                vo.getDescription(),
                vo.getModelType(),
                vo.getImplementationType(),
                vo.getImplementationKey(),
                parseJson(vo.getConfigSchema()),
                parseJson(vo.getDefaultConfig()),
                vo.getIsUserDefined(),
                vo.getIsActive(),
                isRunnable(vo.getImplementationKey()),
                vo.getCreatedBy(),
                vo.getCreatedAt(),
                vo.getUpdatedAt()
        );
    }

    private boolean isRunnable(String implementationKey) {
        if (implementationKey == null || implementationKey.isBlank()) {
            return false;
        }
        return codeModels.stream().map(QuantModelDefinition::implementationKey).anyMatch(implementationKey::equals);
    }

    private String resolveImplementationType(String implementationKey) {
        return isRunnable(implementationKey) ? CODE_MODEL : USER_MODEL;
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");
    }

    private String normalizeUpper(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String valueOrExisting(String value, String existing) {
        return value == null ? existing : value;
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (Exception e) {
            throw new IllegalArgumentException("JSON 설정을 저장할 수 없습니다.", e);
        }
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
