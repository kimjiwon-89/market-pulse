package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantCoreFeatureSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantCoreFeatureSnapshotMapper {
    int generateMpCoreFeatures(
            @Param("modelCode") String modelCode,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    List<QuantCoreFeatureSnapshotVo> findByModelAndDate(
            @Param("modelCode") String modelCode,
            @Param("signalDate") LocalDate signalDate,
            @Param("limit") int limit
    );
}
