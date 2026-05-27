# V4 Bull Model Archive

date: 2026-05-27

This folder keeps V4/W4/V3-FIN research artifacts together.

## Purpose

V4 is now treated as the future `BULL_V4` paper model.

It is not the whole market system anymore. It is one specialist model used only when `MarketSupervisor` routes the market state to `BULL`.

## Contents

```text
plans/
  2026-05-27_v4-bull-paper-integration.md

reports/
  2026-05-27_w4-*.md
  2026-05-27_w4-*.csv

scripts/
  backtest_v3fin_*.py
  analyze_v3fin_*.py
  analyze_w4_*.py
```

## Final Research Snapshot

Balanced paper candidate:

```text
entry_next_body_min: 0.005
range20_max: 0.40
entry_loc_min: 0.55
entry_ma20_dist_min: 0.02
top_n: 50
```

Quality shadow candidate:

```text
entry_next_body_min: 0.01
range20_max: 0.40
ret60_max: 0.80
```

## Notes

- Scripts here are research scripts, not production runtime code.
- Legacy root scripts were moved into `scripts/legacy-root/` so the quant lab root stays clean.
- New architecture work should use `.Codex/plans/2026-05-27_market-supervisor-three-model-architecture.md`.
