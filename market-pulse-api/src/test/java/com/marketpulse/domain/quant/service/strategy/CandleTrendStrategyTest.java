package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.QuantStrategyVo;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
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

    private QuantStrategyVo strategyVo(String name) {
        QuantStrategyVo vo = new QuantStrategyVo();
        vo.setId(100L);
        vo.setName(name);
        return vo;
    }

    private static class RecordingPriceMapper {
        private final List<String> calls = new ArrayList<>();

        private MarketDailyPriceMapper proxy() {
            return (MarketDailyPriceMapper) Proxy.newProxyInstance(
                    MarketDailyPriceMapper.class.getClassLoader(),
                    new Class<?>[]{MarketDailyPriceMapper.class},
                    (proxy, method, args) -> {
                        calls.add(method.getName());
                        if (method.getReturnType().equals(List.class)) {
                            return List.of();
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
