# Production Feature Scope

This document defines the production-owned feature surface for Market Pulse.

Research, experiments, and unapproved model logic belong in `market-pulse-lab`.

## Core Production Features

1. Quant model serving
   - Serve only accepted quant model versions.
   - Expose latest signals, feature snapshots, portfolio targets, backtest evidence, and diagnostics.
   - Keep model version, run version, data version, and app release version separate.

2. Market data API
   - Index data.
   - Full stock master data.
   - Daily/period price data.
   - Chart-ready OHLCV data.
   - Market snapshots, rankings, news snapshots, and derived cached views.

3. Investor flow
   - Foreign net buy/sell.
   - Institution net buy/sell.
   - Individual net buy/sell when available.
   - Query grain must be explicit: trade date, market, stock, investor type, buy/sell/net amount.

4. Lottery service
   - Lotto production UI/API.
   - Pension lottery production UI/API.
   - Serve accepted model outputs only.
   - Raw research and model tuning stay in lab.

5. Tarot service
   - Tarot production UI/API.
   - Serve accepted prompt/model versions only.
   - Treat tarot requests and results as user-sensitive content.

6. Account/auth
   - Signup and login.
   - Session/JWT issuance and refresh policy.
   - Account status, role, provider, and audit fields.
   - Future-ready provider model for local login, social login, and admin/service accounts.

## Production Acceptance Boundary

Lab can propose:

- model candidates
- feature schema changes
- output schema changes
- data contracts
- migration requests

Prod accepts only after:

- validation report is present
- DB/API impact is reviewed
- migration plan exists when needed
- staging validation passes
- release version is assigned
