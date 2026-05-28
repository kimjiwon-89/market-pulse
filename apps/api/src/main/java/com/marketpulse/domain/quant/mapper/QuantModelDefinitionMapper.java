package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantModelDefinitionVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QuantModelDefinitionMapper {
    List<QuantModelDefinitionVo> findAll(@Param("includeInactive") boolean includeInactive);
    QuantModelDefinitionVo findById(@Param("id") Long id);
    QuantModelDefinitionVo findByCode(@Param("modelCode") String modelCode);
    void insert(QuantModelDefinitionVo vo);
    void insertIfNotExists(QuantModelDefinitionVo vo);
    int update(QuantModelDefinitionVo vo);
    int deactivate(@Param("id") Long id);
}
