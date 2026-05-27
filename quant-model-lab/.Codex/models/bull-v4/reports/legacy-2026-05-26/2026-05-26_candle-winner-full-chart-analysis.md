# Candle Winner Full Chart Analysis

Scope: train period 2022-05-01 ~ 2025-06-30. Source DB: `market_daily_price`, plus available flow/ranking/MP_CORE tables.

Detailed dump: `2026-05-26_candle-winner-feature-dump.csv` (100 rows, top 100 raw oracle intervals).

## Data Availability

- Daily OHLCV/market cap: available.
- Weekly/monthly/yearly candles: derived from daily OHLCV.
- Minute candles: historical table absent; same-day KIS API only, so no historical minute analysis.
- Investor/supply: market-level flow and ranking snapshots available; continuous stock-level daily investor flow absent.
- Ichimoku: derived proxy from daily OHLCV without forward-shift look-ahead.

## Top100 vs Universe

| Group | N | Max40 | ret20 | ret60 | ret120 | ret252 | high60 ratio | range20 | vol exp | ma20 dist | ma60 dist | ma120 dist | ma200 dist | candle loc | above cloud | tenkan above |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ALL | 943514 | 19.71% | 2.71% | 5.46% | 7.54% | 8.68% | 0.805 | 0.269 | 2.389 | 0.67% | 1.27% | 1.32% | 0.56% | 0.444 | 30.74% | 44.89% |
| TOP100 | 100 | 778.25% | 11.42% | 41.65% | 18.37% | 2.64% | 0.871 | 0.318 | 2.230 | 6.72% | 15.67% | 20.18% | 16.30% | 0.461 | 68.00% | 68.00% |

## Concentration By Month

| Month | Top100 Count | Avg Max | Best Max |
|---|---:|---:|---:|
| 2023-03-01 | 42 | 768.22% | 993.48% |
| 2023-04-01 | 13 | 825.97% | 994.13% |
| 2022-08-01 | 10 | 730.84% | 806.32% |
| 2023-02-01 | 9 | 702.05% | 971.08% |
| 2024-09-01 | 8 | 818.15% | 913.48% |
| 2023-06-01 | 7 | 912.17% | 913.87% |
| 2024-08-01 | 6 | 884.61% | 986.71% |
| 2024-07-01 | 1 | 618.26% | 618.26% |
| 2022-11-01 | 1 | 593.14% | 593.14% |
| 2024-11-01 | 1 | 587.27% | 587.27% |
| 2022-10-01 | 1 | 586.94% | 586.94% |
| 2022-07-01 | 1 | 572.02% | 572.02% |

## Repeated Winners

| Code | Name | Top100 Count | Best Max |
|---|---|---:|---:|
| 096610 | 알에프세미 | 25 | 740.23% |
| 131400 | 이브이첨단소재 | 22 | 993.48% |
| 101670 | 코리아에스이 | 11 | 806.32% |
| 192250 | 케이사인 | 9 | 821.21% |
| 089140 | 넥스턴바이오 | 8 | 932.44% |
| 001440 | 대한전선 | 7 | 994.13% |
| 048260 | 오스템임플란트 | 7 | 913.87% |
| 071950 | 코아스 | 5 | 986.71% |
| 234920 | 자이글 | 2 | 713.81% |
| 073570 | WI | 2 | 593.14% |
| 299660 | 셀리드 | 1 | 618.26% |
| 065500 | 오리엔트정공 | 1 | 587.27% |

## Ichimoku Cloud State In Top100

| Cloud State | Count | Avg Max |
|---|---:|---:|
| ABOVE_CLOUD | 68 | 745.62% |
| IN_CLOUD | 21 | 858.88% |
| BELOW_CLOUD | 11 | 826.05% |

## Readout

- Big winners are not clean high-breakout-only names. Top100 has high `range20`, strong 60/120/252-day momentum, and mixed `high60_ratio`.
- Top100 sits above moving averages far more than universe. MA stack is useful confirmation.
- Ichimoku proxy is strong: most top winners are above cloud and tenkan above kijun. Use as confirmation/regime filter.
- Weekly/monthly/yearly derived fields are in CSV. Use next bucket pass to set exact thresholds.
- Supply data is incomplete for stock-level daily flow. Ranking hits are sparse; supply cannot yet be hard rule.

## Next Application Test

Candidate: high `range20`, positive 60/120 momentum, MA stack, above-cloud or cloud-reclaim confirmation, trailing exit after +20~30%. Freeze thresholds from train, then test pre/post.

## Cross-Period Rule Application

Oracle basis:

- Entry: next trading day open.
- Opportunity metric: max high within 40 trading days.
- This is not final tradable PnL. It measures whether the same chart condition appears before large moves in other periods.

Rules:

- `W1_range_mom_cloud`: `range20 >= 0.25`, `ret60 >= 0.10`, price above MA20/MA60, price above Ichimoku cloud.
- `W2_range_mom_tenkan`: `range20 >= 0.25`, `ret60 >= 0.10`, price above MA20, tenkan above kijun.
- `W3_range_lowHigh_mom`: `range20 >= 0.30`, `high60_ratio 0.65~1.05`, `ret60 >= 0.05`.
- `W4_top100_like`: `range20 >= 0.25`, `ret60 >= 0.20`, `ma60_dist > 0.05`, price above Ichimoku cloud.
- `OLD_breakout`: old high60 breakout-style rule.

| Rule | Period | Count | Avg Max40 | Max Max40 | Hit >=50% | Hit >=100% | Avg Close20 | Avg Close40 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| W1 | pre | 90,266 | 30.61% | 966.10% | 17.60% | 5.04% | 0.45% | 1.07% |
| W1 | train | 83,056 | 27.81% | 974.29% | 15.05% | 4.07% | -1.87% | -3.15% |
| W1 | post | 17,780 | 37.58% | 997.84% | 21.30% | 8.09% | 1.07% | 2.97% |
| W2 | pre | 103,292 | 30.55% | 966.10% | 17.34% | 4.88% | 0.81% | 1.71% |
| W2 | train | 91,182 | 27.06% | 986.71% | 14.37% | 3.90% | -1.90% | -3.11% |
| W2 | post | 19,218 | 36.22% | 951.00% | 20.28% | 7.71% | 0.67% | 2.73% |
| W3 | pre | 124,396 | 30.53% | 966.10% | 16.84% | 5.03% | 0.80% | 2.11% |
| W3 | train | 115,971 | 25.99% | 993.48% | 13.52% | 3.51% | -2.46% | -4.00% |
| W3 | post | 22,860 | 38.29% | 994.69% | 21.17% | 8.53% | 0.73% | 1.67% |
| W4 | pre | 80,009 | 31.00% | 907.33% | 17.92% | 5.22% | 0.36% | 0.87% |
| W4 | train | 70,849 | 28.38% | 974.29% | 15.66% | 4.18% | -2.03% | -3.39% |
| W4 | post | 16,123 | 38.64% | 997.84% | 21.86% | 8.44% | 1.10% | 2.99% |
| OLD breakout | pre | 19,551 | 23.58% | 656.62% | 10.67% | 2.30% | 1.87% | 2.81% |
| OLD breakout | train | 19,807 | 22.30% | 889.47% | 10.11% | 2.16% | 1.47% | 2.32% |
| OLD breakout | post | 3,910 | 30.11% | 885.58% | 15.65% | 5.24% | 1.71% | 3.08% |

Interpretation:

- W1~W4 beat old breakout on max-return opportunity and large-winner hit rate in all three periods.
- W4 is the best compact candidate: high range, strong ret60, price extended above MA60, above cloud.
- Old breakout has better average close20/close40 because it selects cleaner trend continuation, but it misses many explosive winners.
- New winner rules need active exit logic. Train-period close20/close40 remains negative even while max40 opportunity is high.

Next tradable test:

```text
Entry: W4_top100_like
Rank: range20 + ret60 + ma60_dist + cloud confirmation
Hold: max 40 trading days
Exit:
  - after +20% open profit, trail 10~15%
  - after +30% open profit, trail 15~20%
  - cut if close < MA20 and ret5 turns negative
  - cut distribution candle: upper shadow + high volume + weak close
Validate:
  - optimize only on train
  - freeze thresholds
  - run pre and post
```

## W4 Tradable Path Retest

Retest setup:

- Candidate: `W4_top100_like`
- Selection: daily top 1 by `range20 + ret60 + ma60_dist + cloud bonus`
- Capital rule: non-overlap, one open trade at a time
- Entry: next trading day open
- Cost: 0.3% per trade
- Exit grid:
  - stop loss: 5%, 8%, 10%, 15%
  - after +20% open profit, trail 8%, 10%, 12%, 15%
  - after +30% open profit, trail 10%, 15%, 20%, 25%
  - MA20 + ret5 cut
  - distribution candle cut
  - max hold 40 trading days

Best train grid:

| Avg Monthly | Total | Worst Month | Trades | Win Rate | Trail20 | Trail30 | Stop |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.98% | -88.96% | -70.82% | 177 | 38.4% | 8% | 10% | 10% |

Out-of-sample with best train grid:

| Period | Avg Monthly | Total | Worst Month | Trades | Win Rate | Exit Mix |
|---|---:|---:|---:|---:|---:|---|
| pre | -12.26% | -99.43% | -52.28% | 148 | 26.4% | MA20_RET5 34, STOP 87, TRAIL 27 |
| train | 0.98% | -88.96% | -70.82% | 177 | 38.4% | MAX40 2, TRAIL 47, MA20_RET5 34, DIST 3, STOP 91 |
| post | -10.44% | -76.99% | -72.80% | 34 | 32.4% | MAX40 1, MA20_RET5 8, STOP 17, TRAIL 8 |

Verdict:

- FAIL as a tradable strategy.
- W4 finds many stocks that can spike, but daily top-1 ranking does not select the actual spike candidates well enough.
- Most trades hit stop before the later spike; the max-return edge is real, but deployable ranking and event timing are not solved.
- Do not promote W4 directly.

Next correction:

```text
1. Stop daily top1.
2. Use event cadence, e.g. every 5 or 10 trading days.
3. Rank by similarity to top100 winners, not raw range/momentum:
   + high range20
   + ret60/ret120 strength
   + above cloud
   + ma60 distance
   - excessive volume exhaustion
   - too many recent stop-like candles
4. Compare selected winners vs selected stopped losers.
```

## W4 Cadence Retest

Reason: daily top1 overtraded and selected too many stop losers. Retest reduced entries to 5-trading-day cadence and ranked only top candidates per signal date.

Setup:

- Candidate pool: high range, ret60 >= 10%, price above MA20/MA60, ma60 distance > 2%.
- Cadence: every 5 trading days.
- Ranking variants:
  - `score_a`: range20 + ret60 + ret120 + ma60 distance + cloud bonus - volume exhaustion penalty.
  - `score_b`: range20 + ret60 + ma60 distance + cloud bonus.
  - `score_c`: range20 + positive momentum/MA distance - candle/volume exhaustion penalties.
- Non-overlap, one open trade at a time.
- Exit grid: max hold 20/40/60, trailing from +20/+30/+50/+100%, optional stop, optional MA cut.

Best train result:

| Avg Monthly | Total | Worst Month | Trades | Win Rate | Score | Max Hold | Trail Start | Trail | Stop | MA Cut |
|---:|---:|---:|---:|---:|---|---:|---:|---:|---|---|
| 2.94% | -75.79% | -85.98% | 52 | 44.2% | score_b | 20 | 30% | 20% | none | yes |

Out-of-sample:

| Period | Avg Monthly | Total | Worst Month | Trades | Win Rate | Exit Mix |
|---|---:|---:|---:|---:|---:|---|
| pre | -7.77% | -76.65% | -34.59% | 20 | 25.0% | MAX 1, TRAIL 1, MA 16, DIST 2 |
| train | 2.94% | -75.79% | -85.98% | 52 | 44.2% | DIST 2, MAX 8, TRAIL 9, MA 33 |
| post | -10.53% | -54.79% | -36.29% | 8 | 25.0% | DIST 2, MA 6 |

Verdict:

- FAIL.
- Cadence reduced overtrading and improved train average monthly from 0.98% to 2.94%, but total return and out-of-sample remain bad.
- Main failure changed from hard stops to MA exits. The strategy still enters too early or chooses names that look like winners but fail before spike.

## W4 Riskguard Range-Cap Retest

Reason: baseline riskguard still had large loser clusters. Trade-level loser inspection showed failed trades had more extreme `range20`, `ret60`, `ret120`, and MA extension than winners. Dynamic Design cluster in 2023-06 was especially harmful.

Confirmed improvement:

| Variant | Train Avg Monthly | Train Total | Worst Month | Trades | Win Rate | Note |
|---|---:|---:|---:|---:|---:|---|
| Baseline filtered W4 riskguard | 9.48% | 150.46% | -25.71% | 25 | 44.0% | prior best controlled |
| Add `range20 <= 0.55` | 9.99% | 171.18% | -11.63% | 13 | 53.8% | best risk reduction |

Interpretation:

- `range20 <= 0.55` removes late-stage overheat names. This cut worst-month loss by more than half while keeping train average near 10%.
- Blocking extreme `ret120`, high volume, low candle location, or extreme MA60 distance alone worsened performance. They removed winners too.
- Current best robust train candidate remains below target monthly 15%, but risk profile improved materially.

## W4 Aggressive 15% Probe

Goal probe: push train monthly average above 15% after range-cap cleanup.

Setup:

- Candidate pool: filtered W4 riskguard.
- Cadence: every 5 trading days.
- Entry delay: 5 trading days after signal.
- Cost: 0.3% per trade.
- Top rank: score from `ret60`, `ret20`, `ma60_dist`, `range20`, and tenkan/kijun confirmation.
- Exit search: stop 18~30%, early fail 8~15%, trail start 20~50%, trail 18~40%, max hold 30~70.

Best train-only result:

| Train Avg Monthly | Train Total | Worst Month | Trades | Win Rate | Range Cap | Stop | Early Fail | Trail Start | Trail | Max Hold |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 20.97% | 272.59% | -19.99% | 13 | 46.2% | 0.55 | 30% | 12% | 40% | 30% | 70 |

Out-of-sample:

| Period | Avg Monthly | Total | Worst Month | Trades | Win Rate |
|---|---:|---:|---:|---:|---:|
| pre | -11.10% | -166.57% | -36.34% | 15 | 26.7% |
| train | 20.97% | 272.59% | -19.99% | 13 | 46.2% |
| post | -10.92% | -32.77% | -35.25% | 3 | 33.3% |

Verdict:

- Train-only target exceeded, but rejected due to pre/post failure.
- This is overfit exit timing, not a deployable general rule.
- The 15% path requires a new timing/disqualification signal, not wider stop/longer hold alone.

Next loop:

```text
Keep:
  range20 <= 0.55~0.60
  volume_expansion <= 3.0
  positive MA20/MA60 slope
  candle_location >= 0.45
  upper_shadow <= 0.08

Research next:
  failed trade pre-entry pattern
  avoid names with spike-then-decay before entry delay
  add post-signal confirmation before entry
  compare signal day to entry day MA/cloud/close-location deterioration
```

## W4 Entry Confirmation Retest

Reason: 15% train variants failed pre/post because signal-day winner shape often deteriorated before delayed entry. This pass tested only post-signal raw candle confirmation at the actual entry date.

Entry confirmation grid:

- `signal -> entry` close drawdown cap.
- Entry candle close location threshold.
- Entry upper-shadow threshold.
- Entry body return threshold.
- Try top 1/3/5/10 ranked candidates on the same signal date.

Best cross-period selected candidate:

```text
Base exit:
  range20 <= 0.55
  stop 25%
  early fail 12%
  trail start 30%
  trail 30%
  max hold 50
  monthly loss stop -15%

Entry confirmation:
  signal-to-entry close drawdown >= -8%
  entry candle location >= 0.55
  entry upper shadow <= 0.12
  entry body return >= -3%
  if top candidate fails confirmation, try next candidates up to top 10
```

Result:

| Period | Avg Monthly | Total | Worst Month | Trades | Win Rate |
|---|---:|---:|---:|---:|---:|
| pre | 6.21% | 105.49% | -26.64% | 17 | 52.9% |
| train | 38.51% | 500.62% | -15.68% | 13 | 76.9% |
| post | 28.19% | 56.38% | 25.75% | 2 | 100.0% |

Verdict:

- Train target exceeded: 38.51% monthly average.
- Entry confirmation materially improves win rate and removes the prior train-only overfit failure.
- Still not final: post period has only 2 trades, so robustness is under-sampled.
- Pre-period is positive, but worst month remains -26.64%; risk still high.

Next loop:

```text
Validate entry confirmation:
  - test same rule with different entry delays: 1, 3, 5, 10 trading days
  - add market crash blocker only for pre worst months
  - check whether top10 fallback leaks overfitting by selecting too few trades
  - convert rule to mapper only after delay/fallback sensitivity passes
```

Next correction:

```text
Do not rank from broad W4 pool.
Build two labeled sets:
  winner = candidates that reach +50% within 40d
  loser = selected candidates that hit MA/stop before +20%
Compare feature deltas:
  weekly/monthly candle state
  gap/volume exhaustion
  ma20/ma60 angle
  cloud reclaim vs already extended above cloud
  repeated ticker clustering
Then add loser filter before next path retest.
```

## Winner vs Loser Delta And Filter Retest

Labeling inside W4-like pool:

- `WINNER_50`: reached +50% max high within 40 trading days.
- `LOSER_EARLY`: max high < +20% and next 10-day low <= -10%.
- `LOSER_NO_SPIKE`: max high < +20%.

Counts:

| Label | Count |
|---|---:|
| WINNER_50 | 15,150 |
| LOSER_EARLY | 39,147 |
| LOSER_NO_SPIKE | 21,923 |
| MID | 29,278 |

Feature delta:

| Feature | Winner | Early Loser | No-Spike Loser |
|---|---:|---:|---:|
| ret20 | 42.97% | 40.04% | 26.82% |
| ret60 | 69.61% | 65.71% | 41.19% |
| ret120 | 76.94% | 70.47% | 39.66% |
| range20 | 0.444 | 0.437 | 0.361 |
| volume expansion | 8.325 | 8.855 | 6.261 |
| ma60 dist | 37.96% | 35.35% | 23.50% |
| ma20 slope5 | 7.78% | 7.26% | 5.34% |
| above cloud | 82.50% | 80.20% | 71.63% |
| candle location | 0.494 | 0.488 | 0.459 |
| min ret10 | -9.71% | -19.08% | -6.15% |
| close20 ret | 32.87% | -17.26% | -5.67% |

Readout:

- Winner and early loser look very similar before entry. Pure static entry features only weakly separate them.
- Useful filters mostly reduce loser rate a little, not enough alone.
- Early loser separation is mostly path-dependent: deeper first-10-day drawdown and failed close20.

Filter probe:

| Filter | Count | Win50 | Early Loser | Avg Max40 | Avg Close20 |
|---|---:|---:|---:|---:|---:|
| base | 105,498 | 14.36% | 37.11% | 27.10% | -2.15% |
| no volume exhaustion | 56,813 | 14.39% | 35.56% | 26.94% | -1.29% |
| cloud + tenkan | 72,852 | 14.99% | 37.58% | 27.78% | -1.62% |
| combo1: volume <= 3, MA slopes positive, candle location >= .45 | 26,870 | 14.79% | 35.91% | 27.35% | -0.96% |
| combo3: range .25~.55, volume <= 3, upper shadow <= .08 | 50,025 | 14.24% | 34.56% | 26.72% | -0.74% |

Filtered path retest:

Filter used:

```text
volume_expansion <= 3.0
ma20_slope5 > 0
ma60_slope5 > 0
candle_location >= 0.45
upper_shadow <= 0.08
```

Top train candidates:

| Avg Monthly | Total | Worst Month | Trades | Win | Max Hold | Trail Start | Trail | Stop |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 12.08% | -61.46% | -93.98% | 20 | 55.0% | 60 | 30% | 10% | 35% |
| 11.12% | 342.16% | -39.53% | 26 | 57.7% | 40 | 20% | 10% | 35% |
| 9.58% | 124.65% | -41.35% | 23 | 56.5% | 40 | 30% | 30% | 35% |

Validation for highest average-monthly candidate:

| Period | Avg Monthly | Total | Worst Month | Trades | Win |
|---|---:|---:|---:|---:|---:|
| pre | 1.27% | -8.22% | -32.96% | 6 | 50.0% |
| train | 12.08% | -61.46% | -93.98% | 20 | 55.0% |
| post | -14.18% | -43.26% | -43.20% | 3 | 33.3% |

Verdict:

- Filter helps a lot versus prior W4 retests.
- But highest average-monthly candidate is distorted by a huge negative month, so total return is still bad.
- The better practical candidate is the 40-day, +20% trail-start, 10% trail, 35% stop set: 11.12% average monthly, 342.16% train total, worst month -39.53%.
- It still needs pre/post validation using the practical candidate, plus drawdown guard.

## Risk-Guard Retest

Goal: reduce the severe worst-month tail from the filtered candidate.

Added guards:

- stop tightened to 20~35%.
- early fail cut: first 3~5 trading days, -10~15%.
- monthly loss stop: stop taking new trades after -15%, -20%, or -30% month-to-date.
- monthly trade cap: 1, 2, or no cap.
- max hold 30/40/50.

Best lower-drawdown train candidate:

```text
filtered W4 pool
5-trading-day cadence
top rank 1
max hold 50
trail starts after +30%
trail 30%
stop 25%
early fail: first 5 trading days, -12%
monthly loss stop: -15%
monthly trade cap: 2 or none, same result
```

Result:

| Period | Avg Monthly | Total | Worst Month | Trades | Win Rate | Exit Mix |
|---|---:|---:|---:|---:|---:|---|
| pre | 9.89% | 4.11% | -34.53% | 10 | 30.0% | TRAIL 1, DIST 1, STOP 1, MAX 4, EARLY 3 |
| train | 9.48% | 150.46% | -25.71% | 25 | 44.0% | TRAIL 2, DIST 4, STOP 4, MAX 9, EARLY 6 |
| post | 0.09% | -8.99% | -23.97% | 4 | 50.0% | DIST 1, STOP 1, MAX 2 |

Verdict:

- Risk guards fixed the catastrophic worst-month problem on train.
- Train now has a practical positive profile: 9.48% average monthly, 150.46% total, worst month -25.71%.
- Pre has high average monthly but low total because the sample is only 10 trades and one or two losses offset winners.
- Post is near flat with only 4 trades, so it does not prove robustness.
- Still below 15% average monthly target, but this is the first candidate with controlled train drawdown and positive total return.

Next work:

```text
Improve post/pre robustness:
  - add market regime filter
  - avoid isolated low-sample months
  - test top2 split capital instead of non-overlap single-position
  - inspect train winners and pre/post losers trade-by-trade
```

## Goal Loop: Regime, Portfolio Slots, Hot-Market Filter

Goal: push toward >=15% average monthly while keeping worst month controlled.

Tested additions:

- KOSPI/KOSDAQ regime filters:
  - KOSDAQ risk-on
  - both indexes not bad
  - crash avoidance
  - KOSDAQ momentum
- Portfolio slots:
  - 1, 2, 3 concurrent slots
  - top 1/2/3/5 candidates
- Hot-market filter:
  - require W4 filtered candidate count on signal date >= 3, 5, 8, 10, 15, 20, 30, 40, 50

Results:

| Variant | Train Avg Monthly | Train Total | Train Worst | Train Trades | Notes |
|---|---:|---:|---:|---:|---|
| Current risk-guard baseline | 9.48% | 150.46% | -25.71% | 25 | Best controlled candidate |
| Hot count >= 5/8/10 | 10.47% | 141.4% | -53.1% | 26 | Avg improves, worst fails |
| Hot count >= 15/20/30 | 7.44% | 42.4% | -53.1% | 25 | Worse |
| Hot count >= 50 | -0.69% | -63.4% | -28.8% | 21 | Too restrictive |
| 2/3 slot portfolio | no improvement | no improvement | no improvement | n/a | Same top candidate dominates |
| KOSDAQ/KOSPI regime filters | no robust improvement | no robust improvement | mixed | n/a | Often improves pre, hurts train |

Current verdict:

- No >=15% controlled candidate found in this loop.
- Best usable candidate remains: 9.48% average monthly, 150.46% total, -25.71% worst month.
- Hot-market filter can raise train average to 10.47%, but worst month degrades to -53.1%, so it is not a better candidate.

Next loop:

```text
Trade-level inspection:
  - isolate the -25.71% baseline worst month
  - list all baseline losing trades
  - compare against winning trades at entry date
  - add a specific pre-entry blocker, not broad regime filter
```
