package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.QuantExperimentRunVo;
import com.marketpulse.domain.quant.vo.QuantExperimentVariantVo;
import com.marketpulse.domain.quant.vo.QuantExperimentWindowVo;
import com.marketpulse.domain.quant.vo.QuantSignalLogVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuantExperimentMapper {
    List<QuantExperimentRunVo> findRuns(
            @Param("strategyNameEn") String strategyNameEn,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("status") String status
    );

    QuantExperimentRunVo findRunById(@Param("id") Long id);

    void insertRun(QuantExperimentRunVo run);

    void updateRunStatus(
            @Param("id") Long id,
            @Param("status") String status,
            @Param("message") String message
    );

    List<QuantExperimentVariantVo> findVariantsByRunId(@Param("runId") Long runId);

    QuantExperimentVariantVo findVariantById(
            @Param("runId") Long runId,
            @Param("variantId") Long variantId
    );

    void insertVariant(QuantExperimentVariantVo variant);

    void promoteVariant(
            @Param("runId") Long runId,
            @Param("variantId") Long variantId
    );

    List<QuantExperimentWindowVo> findWindowsByRunId(@Param("runId") Long runId);

    void insertWindows(@Param("list") List<QuantExperimentWindowVo> windows);

    void insertSignalLogs(@Param("list") List<QuantSignalLogVo> logs);
}
