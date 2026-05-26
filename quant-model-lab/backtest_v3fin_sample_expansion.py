"""Sample expansion around current V3-FIN-NB candidate."""
import pandas as pd

import backtest_v3fin_early_fail as base

COMMON = {
    "entry_next_body_min": 0.0,
    "stop": -0.18,
    "ef": -0.08,
    "ts": 0.20,
    "tp": 0.20,
    "mh": 30,
}

variants = []
for top_n in [5, 10, 15, 20]:
    for cadence in [3, 5, 7, 10]:
        label = f"nb_top{top_n}_cad{cadence}"
        variants.append((label, {**COMMON, "top_n": top_n, "cadence_days": cadence}))

# Slightly wider post-sample probes. Keep separate labels so they are easy to reject.
for top_n in [10, 15, 20]:
    for cadence in [3, 5]:
        label = f"nb_relax_shadow_top{top_n}_cad{cadence}"
        variants.append((label, {**COMMON, "top_n": top_n, "cadence_days": cadence, "entry_shadow": 0.08}))
        label = f"nb_relax_loc_top{top_n}_cad{cadence}"
        variants.append((label, {**COMMON, "top_n": top_n, "cadence_days": cadence, "entry_loc": 0.60}))

rows = []
frames = []
for label, params in variants:
    trades = base.run_bt(label, **params)
    frames.append(trades)
    rows.extend(base.summarize_variant(label, trades))

trades_path = ".Codex/reports/2026-05-26_w4-v3fin-sample-expansion-trades.csv"
pd.concat(frames, ignore_index=True).to_csv(trades_path, index=False, encoding="utf-8-sig")

report_path = ".Codex/reports/2026-05-26_w4-v3fin-sample-expansion.md"
base.write_report(
    report_path,
    rows,
    trades_path,
    readout=[
        "- Grid starts from current candidate: next-day body confirmation, stop -18%, early_fail -8%.\n",
        "- Main variables: top fallback and signal cadence.\n",
        "- Relaxed shadow/location rows are probes for post sample expansion; reject if train drops below 15% or worst worsens too much.\n",
    ],
)
print(f"saved {report_path}")
