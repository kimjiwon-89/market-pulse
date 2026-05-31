# Quant Serving Domain

Production-serving layer for accepted quant models.

Owns:

- model registry display
- accepted model outputs
- production signal APIs
- feature/signal read contracts
- rollback and kill-switch behavior
- KOSPI/KOSDAQ market regime monitor snapshots for quant routing
- folder-driven package intake with admin-controlled public exposure

Lab research stays in `market-pulse-lab`.

## Market Regime Monitor

Production implementation:

```text
apps/api/src/main/java/com/marketpulse/domain/quant/live/service/MarketRegimeEngine.java
apps/api/src/main/java/com/marketpulse/domain/quant/live/service/MarketRegimeMonitorService.java
apps/api/src/main/java/com/marketpulse/domain/quant/live/scheduler/MarketRegimeMonitorScheduler.java
apps/api/src/main/resources/mapper/quant/QuantMarketRegimeSnapshotMapper.xml
db/migrations/2026-05-30-quant-market-regime-snapshot.sql
```

Runtime flow:

1. `IndexService.fetchAndSaveAll()` refreshes KIS-backed KOSPI/KOSDAQ `index_snapshot` rows.
2. `MarketRegimeMonitorScheduler` runs during market hours after the index snapshot cadence.
3. Slow features come from `market_daily_price` using the latest completed KOSPI/KOSDAQ index date.
4. Live KOSPI/KOSDAQ levels come from latest `index_snapshot` rows: `0001` and `1001`.
5. Result is upserted to `quant_market_regime_snapshot`.

Routing output:

- `kospi_regime`, `kospi_allowed_strategy`, `kospi_risk_budget`: KOSPI model routing input.
- `kosdaq_regime`, `kosdaq_allowed_strategy`, `kosdaq_risk_budget`: KOSDAQ model routing input.
- `combined_regime`, `allowed_strategy`, `risk_budget`: conservative whole-market guardrail only.

API:

```text
GET  /api/quant/live/market-regime/latest
POST /api/quant/live/market-regime/refresh  # ADMIN only
```

The first version uses the existing KIS REST snapshot path. A direct WebSocket provider can replace the live price source later without changing the regime engine contract.

## Quant Package Intake

Drop production-candidate packages under:

```text
domains/quant-serving/packages/<MODEL_CODE>/manifest.json
```

The admin API scans that folder into `quant_model_package_registry`:

```text
GET   /api/admin/quant/packages
POST  /api/admin/quant/packages/scan
PATCH /api/admin/quant/packages/{modelCode}/visibility
```

User-facing `/api/quant/live/models` includes runtime models plus package models only when `public_visible=true`.

Current visible package shells seeded on `2026-05-31`:

| Model code | Display name | Package/config reference | Seed money | Status | Runtime ready |
|---|---|---|---:|---|---|
| `KOSPI_BULL` | `KOSPI Bull v1` | `domains/quant-serving/packages/KOSPI_BULL` | `100000000` | `APPROVED` package shell | `false` |
| `KOSDAQ_BULL` | `KOSDAQ Bull v1` | `kosdaq-bull-v1.0.0` | `100000000` | `APPROVED` package shell | `false` |
| `KOSPI_WATCH` | `KOSPI Watch` | `kospi-watch-v0.1.0` | `100000000` | `APPROVED` package shell | `false` |
| `KOSDAQ_WATCH` | `KOSDAQ Watch` | `kosdaq-watch-v0.1.0` | `100000000` | `APPROVED` package shell | `false` |

Dropping a package never deploys it, runs it, or exposes it by itself. Registry approval controls list exposure only; runtime activation still requires a `LiveQuantModelRuntime`.
