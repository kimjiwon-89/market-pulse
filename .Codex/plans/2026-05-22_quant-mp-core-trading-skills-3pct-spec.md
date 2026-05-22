# MP_CORE Trading Skills 3% Upgrade Spec

date: 2026-05-22
status: PLANNED
goal: 2020-01-02 ~ 2025-12-31 backtest, monthly compound return >= 3%, MDD < 30%
source: `.Codex/reports/trading-skills-analysis.md`

## Objective

Apply trading/backtesting/risk skill findings to MP_CORE.

Targets:

- Net monthly compound return >= 3.0%
- MDD < 30%
- Costs and turnover included
- No look-ahead bias
- No live order execution in this iteration

## Apply Now

| Area | MP_CORE change |
|---|---|
| Backtest bias guard | Separate `signalDate`, `rebalanceDate`, `executionDate`, return period |
| Strategy comparison | Compare baseline, regime filter, momentum filter, risk cap variants |
| Risk management | Drawdown guard, volatility guard, market guard, position caps |
| Portfolio | Stock cap, sector cap, KOSDAQ cap, cash floor |
| Trading journal | Store buy/sell reason, risk flags, variant/run id |
| Live trading safety | Design only: paper -> read-only -> manual live -> limited live |

## Data Plan

- STOCK daily data for KOSPI/KOSDAQ: 2020-01-02 ~ 2025-12-31
- INDEX rows in `market_daily_price`: `asset_type='INDEX'`, `asset_code='KOSPI'`
- Optional later: `KOSDAQ`, `KOSPI200`

## Model Plan

Feature candidates:

- `ret_20d`, `ret_60d`, `ret_120d`, `ret_252d`
- `risk_adj_ret_60d`, `risk_adj_ret_252d`
- `vol_20d`, `vol_60d`, `vol_120d`, `downside_vol_60d`
- `liquidity_rank`, `trade_amount_rank`
- `drawdown_60d`
- `market_regime_score`
- `index_price_above_ma_120`, `index_price_above_ma_200`

Scoring baseline:

```text
score =
  0.25 * risk_adj_momentum_rank
+ 0.25 * short_momentum_rank
+ 0.15 * medium_momentum_rank
+ 0.15 * liquidity_rank
+ 0.10 * stability_rank
+ 0.10 * drawdown_recovery_score
- risk_penalty
```

Variant grid:

- topN: 5, 8, 10, 15
- vol_60d max: 0.10, 0.12, 0.15
- RISK_OFF cash floor: 50%, 70%, 100%
- rebalance: monthly first, weekly later

## Market Regime

- RISK_ON: KOSPI close > 120MA and 200MA trend not falling
- NEUTRAL: partial exposure, higher score threshold
- RISK_OFF: no new buy or cash floor >= 50%

## Portfolio / Risk

- stock max weight: 12%
- sector max weight: 35%
- KOSDAQ max weight: 50%
- RISK_OFF cash floor: >= 50%
- high-risk flags reduce weight or block new buys

## Backtest Rules

- D close signal -> next available trading day close execution if no open price exists
- Include buy commission, sell commission, sell tax, turnover, trade count
- Report monthly compound return, cumulative return, annualized return, MDD, Calmar, Sharpe, win rate, monthly returns, benchmark excess return

## Live Trading Later

No live order now.

```text
MP_CORE signal -> paper portfolio -> order proposal -> risk gate
-> user approval/policy approval -> KIS broker adapter
-> execution report -> reconciliation -> trade journal
```

Safety:

- default `PAPER_ONLY`
- live env flag
- account permission check
- pre/post-trade risk gate
- kill switch
- no LLM direct order authority

## Acceptance Criteria

| AC | Requirement |
|---|---|
| AC-1 | 2020-01-02 ~ 2025-12-31 STOCK data verified or missing dates documented |
| AC-2 | KOSPI INDEX data available for regime calculation |
| AC-3 | MP_CORE feature generation succeeds for target period |
| AC-4 | Backtest separates signal/rebalance/execution/return dates |
| AC-5 | Backtest includes costs and turnover |
| AC-6 | At least 6 variants compared and stored/reported |
| AC-7 | Best accepted variant net monthly compound return >= 3.0% |
| AC-8 | Best accepted variant MDD < 30% |
| AC-9 | If AC-7/8 fail, `.Codex/status/next-tasks.md` records next experiment |
| AC-10 | Backend compile passes |
| AC-11 | Frontend build passes if frontend changes occur |
| AC-12 | Live trading remains design-only; no order API enabled |

## Likely Files

- `market-pulse-api/src/main/resources/mapper/quant/MarketDailyPriceMapper.xml`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/strategy/MpCoreSignalStrategy.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantBacktestService.java`
- `market-pulse-api/src/main/java/com/marketpulse/domain/quant/service/QuantExperimentService.java`
- quant DTO/mapper files as needed
- `.Codex/status/*`

## Interruption Rule

Exact remaining usage percentage is not available to the assistant. Before long runs, write current step to `.Codex/status/next-tasks.md`. If work must pause, stop implementation, update next tasks, create/push branch if possible, and report status.
