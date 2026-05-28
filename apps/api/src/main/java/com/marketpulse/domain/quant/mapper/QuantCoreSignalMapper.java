package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantCoreSignalVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantCoreSignalMapper {
    int generateBaselineSignals(
            @Param("modelCode") String modelCode,
            @Param("signalDate") LocalDate signalDate,
            @Param("limit") int limit
    );

    List<QuantCoreSignalVo> findByModelAndDate(
            @Param("modelCode") String modelCode,
            @Param("signalDate") LocalDate signalDate,
            @Param("limit") int limit
    );
}
