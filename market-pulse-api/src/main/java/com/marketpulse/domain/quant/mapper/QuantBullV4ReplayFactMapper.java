package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantBullV4ReplayFactVo;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayCacheStatusVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantBullV4ReplayFactMapper {
    int deleteByConfigAndExitDateRange(
            @Param("configKey") String configKey,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    int upsertBatch(@Param("list") List<QuantBullV4ReplayFactVo> list);

    List<QuantBullV4ReplayFactVo> findByConfigAndExitDateRange(
            @Param("configKey") String configKey,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    QuantBullV4ReplayCacheStatusVo findCacheStatus(@Param("configKey") String configKey);
}
