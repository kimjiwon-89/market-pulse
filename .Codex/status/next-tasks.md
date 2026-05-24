## Next Tasks

date: 2026-05-24
status: IMPLEMENTED_VERIFYING

### Active Plan
- Spec: `.Codex/plans/2026-05-24_market-data-terminal-spec.md`
- HTML: `.Codex/plans/2026-05-24_market-data-terminal.html`
- Research: `.Codex/reports/2026-05-24_market-data-trading-service-research.md`

### Current Scope
- Build a Toss-like stock data terminal under existing `/stock/:code`.
- Add KIS same-day 1-minute chart API, read-only orderbook/expected execution API, and frontend tabs.
- Add OpenDART disclosure contract and explicit key-missing state.
- Keep report data as metadata/link/summary unless a license permits richer storage.
- Keep live trading disabled. No order placement, amend, or cancel endpoint.

### Implemented
- Created implementation branch from `develop`: `feature/market-data-terminal`.
- Added backend tests for KIS minute chart/orderbook normalization.
- Implemented `GET /api/stock/minute-chart` with KIS `FHKST03010200`.
- Implemented `GET /api/stock/orderbook` with KIS `FHKST01010200`.
- Added disclosure/report metadata endpoints with explicit OpenDART key-missing behavior.
- Split `StockDetail` frontend into terminal tabs: `차트·호가`, `종목정보`, `뉴스·공시`, `거래현황`.
- Verified backend `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home bash mvnw test`.
- Verified frontend `npm run build`.

### Remaining Manual/External Checks
- Live KIS minute/orderbook responses require valid KIS credentials and market hours.
- OpenDART live filings require `OPENDART_API_KEY`.

### Blocked Or Conditional
- Historical 1-minute backfill before our collection start: needs KRX/Koscom/vendor contract.
- OpenDART live filings: needs `OPENDART_API_KEY`.
- Broker/analyst report full text: needs redistribution/license review.
- CFD stock-level detail: needs official or licensed source confirmation.
