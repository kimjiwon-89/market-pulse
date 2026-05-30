package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.live.service.MarketRegimeSnapshot;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuantMarketRegimeSnapshotMapper {
    void upsert(MarketRegimeSnapshot snapshot);

    MarketRegimeSnapshot findLatest();
}
