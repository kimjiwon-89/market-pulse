package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantTradeLogVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantTradeLogMapper {
    int countByStrategyAndPeriod(
            @Param("strategyId") Long strategyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("tradeType") String tradeType
    );

    List<QuantTradeLogVo> findPageByStrategyAndPeriod(
            @Param("strategyId") Long strategyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("tradeType") String tradeType,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    void insertBatch(@Param("list") List<QuantTradeLogVo> list);

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
