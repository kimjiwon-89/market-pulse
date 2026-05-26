package com.marketpulse.domain.quant.runner;

import com.marketpulse.domain.quant.mapper.QuantStrategyMapper;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
public class QuantStrategyInitRunner implements CommandLineRunner {
    private final QuantStrategyMapper strategyMapper;

    @Override
    public void run(String... args) {
        List<QuantStrategyVo> strategies = List.of(
                strategy("MA Crossover", "MA_CROSSOVER", "KOSPI 20/60 day moving-average signal strategy", "INDEX", "SIGNAL", "{\"shortMa\":20,\"longMa\":60}"),
                strategy("Momentum", "MOMENTUM", "Monthly top stock basket by previous-period return", "STOCK", "MONTHLY", "{\"topN\":20,\"lookbackDays\":21}"),
                strategy("Sector Rotation", "SECTOR_ROTATION", "Monthly rotation into leading sectors and large-cap members", "STOCK", "MONTHLY", "{\"topSectors\":3,\"topStocksPerSector\":5}"),
                strategy("Asset Allocation", "ASSET_ALLOCATION", "Static stock/bond/gold allocation baseline", "MULTI", "QUARTERLY", "{\"stockWeight\":0.6,\"bondWeight\":0.3,\"goldWeight\":0.1}"),
                strategy("Volatility Adjust", "VOLATILITY_ADJUST", "Risk allocation adjusted by recent market volatility", "MULTI", "DAILY", "{\"volThreshold\":0.15,\"highVolStockWeight\":0.2,\"lowVolStockWeight\":0.7}"),
                strategy("Dual Momentum", "DUAL_MOMENTUM", "Monthly relative and absolute momentum across KOSPI, KOSDAQ, gold, and defensive assets", "MULTI", "MONTHLY", "{\"lookbackDays\":126,\"riskAssets\":[\"KOSPI\",\"KOSDAQ\",\"GOLD\"],\"defensiveAssets\":[\"KTB3Y\",\"GOLD\"]}"),
                strategy("Short-Term Reversal", "SHORT_TERM_REVERSAL", "Weekly liquid oversold stock basket with market-cap and volume filters", "STOCK", "WEEKLY", "{\"lookbackDays\":5,\"topN\":10,\"minMarketCap\":100000000000,\"minVolume\":100000}"),
                strategy("MP Core Signal", "MP_CORE_SIGNAL", "MP_CORE feature-score portfolio backtest", "STOCK", "MONTHLY", "{\"topN\":20,\"source\":\"quant_core_feature_snapshot\"}"),
                strategy("Candle Breakout", "CANDLE_BREAKOUT_V1", "Monthly candle breakout trend-following stock basket", "STOCK", "MONTHLY", "{\"topN\":10,\"highWindow\":60,\"source\":\"market_daily_price\"}"),
                strategy("Candle Pullback", "CANDLE_PULLBACK_V1", "Monthly candle pullback continuation stock basket", "STOCK", "MONTHLY", "{\"topN\":10,\"pullbackBand\":\"-18pct_to_-3pct\",\"source\":\"market_daily_price\"}"),
                strategy("Candle Momentum H20", "CANDLE_MOMENTUM_H20_V1", "Chart-only momentum basket with 20-trading-day holding period", "STOCK", "MONTHLY", "{\"topN\":5,\"holdDays\":20,\"nearHigh60\":0.95,\"ret20\":0.05,\"ret60\":0.15,\"source\":\"quant_candle_feature_snapshot\"}"),
                strategy("Candle MTF Trend", "CANDLE_MTF_TREND_V2", "Event-driven multi-timeframe candle trend strategy with checkpoint and pattern-based exits", "STOCK", "EVENT", "{\"topN\":1,\"maxHoldDays\":40,\"entryCadenceDays\":10,\"checkpointProfit\":0.20,\"targetAverageMonthlyReturn\":0.15,\"profitExit\":\"CHECKPOINT_OR_PATTERN\",\"minuteFallback\":\"NO_MINUTE_DATA\"}")
        );
        strategies.forEach(strategyMapper::insertIfNotExists);
    }

    private QuantStrategyVo strategy(String name, String nameEn, String description, String assetType, String cycle, String params) {
        QuantStrategyVo vo = new QuantStrategyVo();
        vo.setName(name);
        vo.setNameEn(nameEn);
        vo.setDescription(description);
        vo.setAssetType(assetType);
        vo.setRebalanceCycle(cycle);
        vo.setParams(params);
        vo.setIsActive(true);
        return vo;
    }
}
