# Bull V4 Runtime Config Confusion Handoff

date: 2026-05-27
source app: Market Pulse local runtime
page: `/quant/models/BULL_V4`

## Why This Handoff Exists

The app page showed `BULL_V4` with one 2026 YTD completed trade:

| entry_date | exit_date | code | name | return | pnl_krw |
|---|---|---:|---|---:|---:|
| 2026-04-22 | 2026-04-24 | 138080 | 오이솔루션 | -6.30% | -6,300,000 |

This surprised the user because the expected "Bull V4" mental model is the high-conviction research model, while the app runtime is currently wired to the balanced paper runtime config.

## Local Runtime Facts

Local market data was backfilled through KRX:

| asset_type | rows | first_date | latest_date | trading_days |
|---|---:|---|---|---:|
| GOLD | 96 | 2026-01-02 | 2026-05-26 | 96 |
| INDEX | 192 | 2026-01-02 | 2026-05-26 | 96 |
| STOCK | 266,230 | 2026-01-02 | 2026-05-26 | 96 |

KRX returned no insertable rows for 2026-05-27, so current YTD replay is effectively through 2026-05-26.

Runtime cache table:

```text
quant_bull_v4_replay_fact
config_key = BULL_V4_BALANCED_PAPER
cached rows = 1
```

App API summary after reload:

```json
{
  "modelCode": "BULL_V4",
  "status": "RUNNING",
  "seedMoney": 1000000000,
  "totalReturnPct": -0.63,
  "totalProfit": -6300000,
  "rawCandidateCountToday": 1,
  "actualEntryCountToday": 1,
  "latestReportTime": "2026-04-24T15:45"
}
```

## Stage Counts From Current Runtime SQL

For `2026-01-01` through `2026-05-27`:

| stage | rows | days |
|---|---:|---:|
| raw_candidates | 329 | 18 |
| signal_days | 4 | 4 |
| raw_ranked | 51 | 4 |
| entry_confirmed | 1 | 1 |
| picked | 1 | 1 |

Interpretation:

- The model did not have zero raw candidates.
- Most candidates are eliminated by signal-day cadence and entry confirmation rules.
- The only confirmed/picked completed trade is 오이솔루션.

## Suspected Root Cause Of Confusion

The app exposes the model as simply `BULL_V4`, but the runtime config is:

```text
BULL_V4_BALANCED_PAPER
source label: BULL_V4_REPLAY_BALANCED_PAPER
capital: 1B
position cash: 100M
max buys per signal day: 5
range20: 0.25~0.40
entry delay: 5 trading days
entry check:
  candle_location >= 0.55
  upper_shadow <= 0.08
  body_ret >= 0
  close >= ma20 * 1.02
execution check:
  next body_ret >= 0.005
index gate:
  KOSPI > MA20 and KOSDAQ > MA20
```

The user's expected Bull V4 may instead be the high-conviction/single-slot family documented earlier:

```text
ef_close6_cond_ext60
range20 <= 0.55
entry_loc >= 0.65
entry_ma20_dist >= 0.05
entry_next_body >= 0.01
top_n = 10
one open position lock
candidate-date cadence >= 5 trading days
```

Those are not the same model family and should not share the same plain app label without clarification.

## Request For Quant Model Lab

Please verify which Bull V4 config should be the app-facing `BULL_V4`:

1. Keep `BULL_V4_BALANCED_PAPER` as the app-facing model and rename the UI to make this explicit.
2. Add separate configs:
   - `BULL_V4_BALANCED_PAPER`
   - `BULL_V4_HIGH_CONVICTION`
3. Run both configs on identical 2026 YTD `market_daily_price` data and compare:
   - raw candidates
   - signal days
   - entry confirmed
   - closed trades
   - open/unclosed candidates
   - capital-normalized return
   - single-position headline return
4. Confirm whether the high-conviction model should appear on the runtime dashboard or stay research-only/shadow.

## Important Implementation Note

The app runtime was also adjusted to read YTD replay facts instead of only `2026-05-01+`, so April exits now appear on the model page.

Changed app file:

```text
market-pulse-api/src/main/java/com/marketpulse/domain/quant/live/service/LiveQuantSimulationService.java
```

Report created by app-side check:

```text
.Codex/reports/2026-05-27_bull-v4-2026-ytd-weekly-report.md
```
