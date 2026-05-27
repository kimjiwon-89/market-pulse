# MP_TREND_CANDLE Light Comparison

date: 2026-05-24
period: 2022-05-31 ~ 2025-06-30 for MP_CORE, 2022-05-02 ~ 2025-06-02 entry months for candle variants
method: light/proxy comparison using `quant_core_feature_snapshot`
status: INVALID_FOR_FINAL_MODEL

## Summary

The exact OHLC candle backtest SQL was too slow on the current raw `market_daily_price` shape. To complete a first comparison, this report used a light proxy:

- `CANDLE_BREAKOUT_V1_LIGHT`: positive 20d/60d momentum, close near recent high via `drawdown60d > -4%`, liquidity and volatility filters.
- `CANDLE_PULLBACK_V1_LIGHT`: positive 60d momentum, `drawdown60d` between `-18%` and `-3%`, liquidity and volatility filters.
- Both variants rebalance monthly and hold top 10 picks to month end.
- Monthly return uses average picked stock return minus approximate round-trip cost `0.21%`.

This is not the final exact candle-chart implementation.

Per user direction after this run, this proxy comparison must not be treated as the new trend-following model result because it reused `quant_core_feature_snapshot`. The final model must use only chart/technical OHLCV features derived from `market_daily_price`.

## Result

| Strategy | Months | Picks | Total Return | Monthly Compound | MDD | Win Rate |
|---|---:|---:|---:|---:|---:|---:|
| `MP_CORE_SIGNAL` | 38 | - | 17.86% | 0.43% | -57.77% | - |
| `CANDLE_BREAKOUT_V1_LIGHT` | 38 | 377 | -76.67% | -3.76% | -81.01% | 42.11% |
| `CANDLE_PULLBACK_V1_LIGHT` | 38 | 378 | -81.57% | -4.35% | -86.11% | 34.21% |

## Interpretation

- In this first light comparison, both candle trend variants underperform MP_CORE badly.
- Breakout performs less poorly than pullback, but still has severe drawdown.
- The result suggests that simple monthly top-10 candle/momentum selection is not enough for Korean equities in this period.
- This result is diagnostic only and is invalid as the final candle model benchmark because it used MP_CORE-derived feature storage.

## Next Experiment

Before trusting or abandoning the concept, build a precomputed pure OHLCV candle feature snapshot table:

- `ma20`, `ma60`
- `high20`, `high60_prior`
- `drawdown20`, `drawdown60`
- `candle_location`
- `body_ratio`
- `volume_expansion`
- market regime

Then rerun exact variants with:

- weekly rebalance
- stricter market regime filter
- stop-loss / trailing exit
- no monthly hold-to-end assumption
- liquidity and gap-risk filters
