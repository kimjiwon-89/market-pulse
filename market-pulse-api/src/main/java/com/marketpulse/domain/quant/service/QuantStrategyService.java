package com.marketpulse.domain.quant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.quant.dto.StrategyDto;
import com.marketpulse.domain.quant.mapper.QuantStrategyMapper;
import com.marketpulse.domain.quant.service.strategy.QuantStrategyInterface;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuantStrategyService {
    private final QuantStrategyMapper strategyMapper;
    private final List<QuantStrategyInterface> strategyImpls;
    private final ObjectMapper objectMapper;

    public List<StrategyDto> getAllStrategies() {
        return strategyMapper.findAllActive().stream()
                .map(this::toDto)
                .toList();
    }

    public QuantStrategyVo getStrategy(Long id) {
        QuantStrategyVo strategy = strategyMapper.findById(id);
        if (strategy == null) {
            throw new IllegalArgumentException("전략을 찾을 수 없습니다: " + id);
        }
        return strategy;
    }

    public QuantStrategyInterface getStrategyImpl(String nameEn) {
        Map<String, QuantStrategyInterface> map = strategyImpls.stream()
                .collect(Collectors.toMap(QuantStrategyInterface::getNameEn, Function.identity()));
        QuantStrategyInterface impl = map.get(nameEn);
        if (impl == null) {
            throw new IllegalArgumentException("전략 구현체를 찾을 수 없습니다: " + nameEn);
        }
        return impl;
    }

    private StrategyDto toDto(QuantStrategyVo vo) {
        return new StrategyDto(
                vo.getId(),
                vo.getName(),
                vo.getNameEn(),
                vo.getDescription(),
                vo.getAssetType(),
                vo.getRebalanceCycle(),
                parseParams(vo.getParams())
        );
    }

    private Map<String, Object> parseParams(String params) {
        if (params == null || params.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(params, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
