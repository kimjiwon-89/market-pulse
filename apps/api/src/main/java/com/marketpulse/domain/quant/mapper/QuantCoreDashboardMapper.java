package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantCoreModelRow;
import com.marketpulse.domain.quant.vo.QuantCoreSignalVo;
import com.marketpulse.domain.quant.vo.QuantTradeLogVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface QuantCoreDashboardMapper {
    QuantCoreModelRow findActiveCoreModel();

    LocalDate findLatestSignalDate(@Param("modelCode") String modelCode);

    List<QuantCoreSignalVo> findSignals(
            @Param("modelCode") String modelCode,
            @Param("signalDate") LocalDate signalDate,
            @Param("limit") int limit
    );

    List<QuantCoreSignalVo> findSignalHistory(
            @Param("modelCode") String modelCode,
            @Param("assetCode") String assetCode,
            @Param("signalDate") LocalDate signalDate,
            @Param("limit") int limit
    );

    List<Map<String, Object>> findLatestBacktestCurve(@Param("strategyNameEn") String strategyNameEn);

    List<Map<String, Object>> findLatestMonthlyReturns(@Param("strategyNameEn") String strategyNameEn);

    Map<String, Object> findLatestBacktestPeriod(@Param("strategyNameEn") String strategyNameEn);

    Map<String, Object> findLatestCostSummary(@Param("strategyNameEn") String strategyNameEn);

    int countTradesByStrategy(@Param("strategyId") Long strategyId);

    List<QuantTradeLogVo> findTradesByStrategy(
            @Param("strategyId") Long strategyId,
            @Param("offset") int offset,
            @Param("limit") int limit
    );
}
