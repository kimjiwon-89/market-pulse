package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantModelPackageRegistryVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface QuantModelPackageRegistryMapper {
    List<QuantModelPackageRegistryVo> findAll();
    List<QuantModelPackageRegistryVo> findPublicVisible();
    QuantModelPackageRegistryVo findByCode(@Param("modelCode") String modelCode);
    void upsertDetected(QuantModelPackageRegistryVo vo);
    int updateVisibility(@Param("modelCode") String modelCode,
                         @Param("publicVisible") boolean publicVisible,
                         @Param("packageStatus") String packageStatus,
                         @Param("adminNote") String adminNote);
}
