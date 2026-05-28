# Market Data Domain Claude Rules

Read `README.md` first, then root `market-pulse-prod/CLAUDE.md`.

- Owns production market data APIs/contracts.
- Preserve data freshness/source metadata.
- DB changes require reviewed migrations.
- Do not backfill/write RDS unless explicitly requested and scoped.
