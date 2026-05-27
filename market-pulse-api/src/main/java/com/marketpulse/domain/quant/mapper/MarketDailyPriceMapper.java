package com.marketpulse.domain.quant.mapper;

import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface MarketDailyPriceMapper {
    void upsertBatch(@Param("list") List<MarketDailyPriceVo> list);

    List<MarketDailyPriceVo> findByCodeAndDateRange(
            @Param("assetCode") String assetCode,
            @Param("assetType") String assetType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    List<MarketDailyPriceVo> findByTypeAndDate(
            @Param("assetType") String assetType,
            @Param("tradeDate") LocalDate tradeDate
    );

    int countByTypeAndDate(
            @Param("assetType") String assetType,
            @Param("tradeDate") LocalDate tradeDate
    );

    List<MarketDailyPriceVo> findTopBySectorReturn(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    List<MarketDailyPriceVo> findTopStocksByReturn(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    MarketDailyPriceVo findFirstByTypeAndDateRange(
            @Param("assetType") String assetType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    List<MonthlyPickVo> findMonthlyMomentumPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("lookbackDays") int lookbackDays,
            @Param("topN") int topN
    );

    List<MonthlyPickVo> findMonthlySectorPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("lookbackDays") int lookbackDays,
            @Param("topSectors") int topSectors,
            @Param("topStocksPerSector") int topStocksPerSector
    );

    List<MonthlyPickVo> findMonthlyDualMomentumPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("lookbackDays") int lookbackDays
    );

    List<MonthlyPickVo> findWeeklyShortTermReversalPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("lookbackDays") int lookbackDays,
            @Param("topN") int topN,
            @Param("minMarketCap") long minMarketCap,
            @Param("minVolume") long minVolume
    );

    List<MonthlyPickVo> findMonthlyMpCoreSignalPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    int generateCandleTrendFeatures(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    List<MonthlyPickVo> findMonthlyCandleBreakoutPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    List<MonthlyPickVo> findMonthlyCandlePullbackPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    List<MonthlyPickVo> findMonthlyCandleMomentumH20Picks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN
    );

    List<MonthlyPickVo> findDailyMomentumReplayPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("lookbackDays") int lookbackDays,
            @Param("topN") int topN
    );

    List<MonthlyPickVo> findBullV4PaperReplayPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    List<MonthlyPickVo> findEventDrivenCandleMtfTrendPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN,
            @Param("holdDays") int holdDays
    );

    List<MonthlyPickVo> findEventDrivenCandleMtfTrendNbPicks(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("topN") int topN,
            @Param("holdDays") int holdDays
    );
}
