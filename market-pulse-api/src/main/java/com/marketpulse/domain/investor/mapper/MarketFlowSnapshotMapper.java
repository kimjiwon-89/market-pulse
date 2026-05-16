package com.marketpulse.domain.investor.mapper;

import com.marketpulse.domain.investor.vo.MarketFlowSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MarketFlowSnapshotMapper {
    void upsert(MarketFlowSnapshotVo vo);
    MarketFlowSnapshotVo findLatest(@Param("market") String market);
}
