# Prod Next Actions

Date: 2026-05-28

1. Update API/web run paths for `apps/api` and `apps/web`.
2. Decide final DB migration tool and baseline migration.
3. Run secret scan.
4. Run backend/frontend build after path updates.
5. Remove root duplicated source after processes stop.
6. Review `.agents/handoff/quant/kosdaq-bull/` and decide whether to implement `kosdaq-bull-v1.0.0` as a paper-only `LiveQuantModelRuntime`.
7. If accepted, reproduce the KOSDAQ-only replay cache in prod data before enabling any admin or public surface.

## Stock Detail Next Work

Goal: make `/stock/:code` a useful Market Pulse stock workspace, not a trading screen. Do not add buy/sell/order/account execution features.

### Implement From Current API And DB

1. Replace the current stock-detail layout with panels for summary, chart, orderbook, supply, quant judgment, news/disclosure, and memo.
2. Use existing quote/detail data for current price, change rate, market, market cap, open/high/low, volume, and trade amount.
3. Use `market_daily_price` plus `/api/stock/chart` for daily close and OHLC chart. Add week/month aggregation from daily rows.
4. Use `/api/stock/orderbook` for bid/ask orderbook when KIS credentials are available. Show a clear empty state otherwise.
5. Use `/api/stock/minute-chart` for recent minute candles or recent execution-style table. Label it as recent REST snapshot, not live streaming.
6. Use `/api/stock/investor` for personal/foreign/institution buy, sell, and net flow cards.
7. Use existing memo APIs for stock-linked memo create/list/update/delete.
8. Use existing quant live model APIs to show whether the stock appears in candidates, reports, or model explanations.

### Additional Backend Work

1. Add ranking endpoints or queries for trade amount rank, volume rank, market-cap rank, and foreign/institution net-buy rank.
2. Add 1-day and 52-week range queries from `market_daily_price`.
3. Add stock-specific news filtering from the current news snapshot, using code/name matching first and a stronger source contract later.
4. Complete OpenDART disclosure integration behind `/api/stock/disclosures`.
5. Persist favorites and alert settings server-side instead of keeping them as front-only state.

### Planned New Capabilities

1. Realtime websocket: provide quote/orderbook/minute updates through a Market Pulse websocket channel. Start with server-pushed snapshot updates from existing REST/KIS or DB refresh, then upgrade to true streaming when the upstream contract is ready.
2. Community: add stock-specific posts/comments under each stock detail page. Keep it separate from trading, and include moderation/reporting/admin review hooks from the first implementation.
3. User stock workspace layout: allow each user to hide/reorder non-trading panels after the base stock-detail panels are stable.

### Explicit Non-Goals

1. Do not provide stock trading, order execution, account connection, holdings, balance, or reservation order features.
2. Do not mimic broker-only UI copy that implies trade execution.
3. Do not show fake realtime behavior. If data is polled or cached, label it accordingly.
