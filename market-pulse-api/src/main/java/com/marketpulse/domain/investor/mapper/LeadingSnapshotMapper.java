package com.marketpulse.domain.investor.mapper;

import com.marketpulse.domain.investor.vo.MarketLeadingSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface LeadingSnapshotMapper {
    void upsert(MarketLeadingSnapshotVo vo);
    List<MarketLeadingSnapshotVo> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
