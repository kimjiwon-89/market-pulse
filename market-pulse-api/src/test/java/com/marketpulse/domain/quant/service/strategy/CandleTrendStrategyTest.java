package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CandleTrendStrategyTest {
    private static final LocalDate FROM = LocalDate.of(2020, 1, 2);
    private static final LocalDate TO = LocalDate.of(2025, 12, 31);

    @Test
    void breakoutStrategyUsesCandleBreakoutPicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        CandleBreakoutStrategy strategy = new CandleBreakoutStrategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle Breakout"), FROM, TO, 100_000_000L);

        assertThat(strategy.getNameEn()).isEqualTo("CANDLE_BREAKOUT_V1");
        assertThat(execution.response().strategyName()).isEqualTo("Candle Breakout");
        assertThat(mapper.calls).containsExactly("findMonthlyCandleBreakoutPicks");
    }

    @Test
    void pullbackStrategyUsesCandlePullbackPicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        CandlePullbackStrategy strategy = new CandlePullbackStrategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle Pullback"), FROM, TO, 100_000_000L);

        assertThat(strategy.getNameEn()).isEqualTo("CANDLE_PULLBACK_V1");
        assertThat(execution.response().strategyName()).isEqualTo("Candle Pullback");
        assertThat(mapper.calls).containsExactly("findMonthlyCandlePullbackPicks");
    }

    @Test
    void momentumH20StrategyUsesCandleMomentumPicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        CandleMomentumH20Strategy strategy = new CandleMomentumH20Strategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle Momentum H20"), FROM, TO, 100_000_000L);

        assertThat(strategy.getNameEn()).isEqualTo("CANDLE_MOMENTUM_H20_V1");
        assertThat(execution.response().strategyName()).isEqualTo("Candle Momentum H20");
        assertThat(mapper.calls).containsExactly("findMonthlyCandleMomentumH20Picks");
    }

    @Test
    void mtfTrendStrategyUsesEventDrivenCandlePicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        CandleMtfTrendStrategy strategy = new CandleMtfTrendStrategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle MTF Trend"), FROM, TO, 100_000_000L);

        assertThat(strategy.getNameEn()).isEqualTo("CANDLE_MTF_TREND_V2");
        assertThat(execution.response().strategyName()).isEqualTo("Candle MTF Trend");
        assertThat(mapper.calls).containsExactly("findEventDrivenCandleMtfTrendPicks");
        assertThat(mapper.lastArgs).containsExactly(FROM, TO, 1, 40);
    }

    @Test
    void mtfTrendNbStrategyUsesV3FinNbPicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        CandleMtfTrendNbStrategy strategy = new CandleMtfTrendNbStrategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle MTF Trend V3 FIN NB"), FROM, TO, 100_000_000L);

        assertThat(strategy.getNameEn()).isEqualTo("CANDLE_MTF_TREND_V3_FIN_NB");
        assertThat(execution.response().strategyName()).isEqualTo("Candle MTF Trend V3 FIN NB");
        assertThat(mapper.calls).containsExactly("findEventDrivenCandleMtfTrendNbPicks");
        assertThat(mapper.lastArgs).containsExactly(FROM, TO, 10, 30);
    }

    @Test
    void mtfTrendStrategyFiltersOverlappingEventPicks() {
        RecordingPriceMapper mapper = new RecordingPriceMapper();
        mapper.picks.add(pick("AAA", LocalDate.of(2024, 1, 2), LocalDate.of(2024, 1, 12), "Alpha"));
        mapper.picks.add(pick("BBB", LocalDate.of(2024, 1, 8), LocalDate.of(2024, 1, 18), "Beta"));
        mapper.picks.add(pick("CCC", LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 25), "Gamma"));
        CandleMtfTrendStrategy strategy = new CandleMtfTrendStrategy(mapper.proxy());

        BacktestExecution execution = strategy.run(strategyVo("Candle MTF Trend"), FROM, TO, 100_000_000L);

        assertThat(execution.trades())
                .extracting(trade -> trade.getAssetCode())
                .containsExactly("AAA", "AAA", "CCC", "CCC");
    }

    @Test
    void priceMapperExposesChartOnlyFeatureGeneration() throws NoSuchMethodException {
        assertThat(MarketDailyPriceMapper.class.getMethod(
                "generateCandleTrendFeatures",
                LocalDate.class,
                LocalDate.class
        )).isNotNull();
    }

    @Test
    void priceMapperExposesMomentumH20Picks() throws NoSuchMethodException {
        assertThat(MarketDailyPriceMapper.class.getMethod(
                "findMonthlyCandleMomentumH20Picks",
                LocalDate.class,
                LocalDate.class,
                int.class
        )).isNotNull();
    }

    @Test
    void priceMapperExposesEventDrivenMtfTrendPicks() throws NoSuchMethodException {
        assertThat(MarketDailyPriceMapper.class.getMethod(
                "findEventDrivenCandleMtfTrendPicks",
                LocalDate.class,
                LocalDate.class,
                int.class,
                int.class
        )).isNotNull();
    }

    @Test
    void priceMapperExposesEventDrivenMtfTrendNbPicks() throws NoSuchMethodException {
        assertThat(MarketDailyPriceMapper.class.getMethod(
                "findEventDrivenCandleMtfTrendNbPicks",
                LocalDate.class,
                LocalDate.class,
                int.class,
                int.class
        )).isNotNull();
    }

    @Test
    void mtfTrendMapperUsesV4CheckpointExits() throws Exception {
        String mapperXml = Files.readString(Path.of("src/main/resources/mapper/quant/MarketDailyPriceMapper.xml"));

        assertThat(mapperXml)
                .contains("checkpoint_profit_exit")
                .contains("checkpoint_rollover_exit")
                .contains(">= COALESCE(buy.open_price, buy.close_price) * 1.20")
                .contains("COALESCE(confirm_exit.trade_date, checkpoint_profit_exit.trade_date, checkpoint_rollover_exit.trade_date, profit_exit.exit_date, s.max_exit_date)");
    }

    @Test
    void mtfTrendNbMapperUsesV3FinNbRules() throws Exception {
        String mapperXml = Files.readString(Path.of("src/main/resources/mapper/quant/MarketDailyPriceMapper.xml"));

        assertThat(mapperXml)
                .contains("findEventDrivenCandleMtfTrendNbPicks")
                .contains("entry_check.candle_location >= 0.65")
                .contains("entry_check.upper_shadow <= 0.08")
                .contains("execution_check.body_ret >= 0")
                .contains("ir.kospi_ma20")
                .contains("ir.kosdaq_ma20")
                .contains("early_fail_exit")
                .contains("stop_loss_exit")
                .contains("trail_exit")
                .contains("max_hold_exit");
    }

    private QuantStrategyVo strategyVo(String name) {
        QuantStrategyVo vo = new QuantStrategyVo();
        vo.setId(100L);
        vo.setName(name);
        return vo;
    }

    private MonthlyPickVo pick(String assetCode, LocalDate rebalanceDate, LocalDate exitDate, String assetName) {
        MonthlyPickVo vo = new MonthlyPickVo();
        vo.setAssetCode(assetCode);
        vo.setAssetName(assetName);
        vo.setAssetType("STOCK");
        vo.setRebalanceDate(rebalanceDate);
        vo.setExitDate(exitDate);
        vo.setBuyPrice(new BigDecimal("10000"));
        vo.setSellPrice(new BigDecimal("11000"));
        vo.setScore(BigDecimal.ONE);
        vo.setPickRank(1);
        return vo;
    }

    private static class RecordingPriceMapper {
        private final List<String> calls = new ArrayList<>();
        private final List<Object> lastArgs = new ArrayList<>();
        private final List<MonthlyPickVo> picks = new ArrayList<>();

        private MarketDailyPriceMapper proxy() {
            return (MarketDailyPriceMapper) Proxy.newProxyInstance(
                    MarketDailyPriceMapper.class.getClassLoader(),
                    new Class<?>[]{MarketDailyPriceMapper.class},
                    (proxy, method, args) -> {
                        calls.add(method.getName());
                        lastArgs.clear();
                        if (args != null) {
                            lastArgs.addAll(List.of(args));
                        }
                        if (method.getReturnType().equals(List.class)) {
                            return picks;
                        }
                        if (method.getReturnType().equals(int.class)) {
                            return 0;
                        }
                        return null;
                    }
            );
        }
    }
}
