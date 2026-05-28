package com.marketpulse.domain.investor.mapper;

import com.marketpulse.domain.investor.vo.RankingSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface RankingSnapshotMapper {

    List<RankingSnapshotVo> findByFilter(
            @Param("snapDate") LocalDate snapDate,
            @Param("investorType") String investorType,
            @Param("tradeType") String tradeType,
            @Param("market") String market
    );

    List<String> findAvailableDates(
            @Param("investorType") String investorType,
            @Param("tradeType") String tradeType,
            @Param("market") String market
    );

    void bulkUpsert(@Param("list") List<RankingSnapshotVo> list);

    List<RankingSnapshotVo> findLatestByFilter(
            @Param("investorType") String investorType,
            @Param("tradeType") String tradeType,
            @Param("market") String market
    );
}
