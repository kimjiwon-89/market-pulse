package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QuantStrategyMapper {
    List<QuantStrategyVo> findAllActive();
    QuantStrategyVo findById(@Param("id") Long id);
    QuantStrategyVo findByNameEn(@Param("nameEn") String nameEn);
    void insertIfNotExists(QuantStrategyVo vo);
}
