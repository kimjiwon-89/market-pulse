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
                strategy("MP Core Signal", "MP_CORE_SIGNAL", "MP_CORE feature-score portfolio backtest", "STOCK", "MONTHLY", "{\"topN\":20,\"source\":\"quant_core_feature_snapshot\"}")
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
