package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantBacktestResultVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantBacktestResultMapper {
    List<QuantBacktestResultVo> findByStrategyAndPeriod(
            @Param("strategyId") Long strategyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    void insertBatch(@Param("list") List<QuantBacktestResultVo> list);

    void deleteByStrategyAndPeriod(
            @Param("strategyId") Long strategyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    void deleteByPeriodOverlap(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}
