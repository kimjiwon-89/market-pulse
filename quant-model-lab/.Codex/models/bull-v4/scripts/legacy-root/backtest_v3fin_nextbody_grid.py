"""Narrow grid around the best early-fail reducer: entry next-day body >= 0."""
import pandas as pd

import backtest_v3fin_early_fail as base


variants = []
for ts in [0.15, 0.20, 0.25, 0.30]:
    for tp in [0.15, 0.20, 0.25]:
        for mh in [20, 30, 40]:
            label = f"next_body0_ts{int(ts*100)}_tp{int(tp*100)}_mh{mh}"
            variants.append((label, {"entry_next_body_min": 0.0, "ts": ts, "tp": tp, "mh": mh}))

for stop in [-0.18, -0.20, -0.25]:
    for ef in [-0.06, -0.08]:
        label = f"next_body0_stop{int(abs(stop)*100)}_ef{int(abs(ef)*100)}"
        variants.append((label, {"entry_next_body_min": 0.0, "stop": stop, "ef": ef}))

rows = []
frames = []
for label, params in variants:
    trades = base.run_bt(label, **params)
    frames.append(trades)
    rows.extend(base.summarize_variant(label, trades))

trades_path = ".Codex/reports/2026-05-26_w4-v3fin-nextbody-grid-trades.csv"
pd.concat(frames, ignore_index=True).to_csv(trades_path, index=False, encoding="utf-8-sig")

# Rank by train avg, but keep all rows in report.
report_path = ".Codex/reports/2026-05-26_w4-v3fin-nextbody-grid.md"
base.write_report(
    report_path,
    rows,
    trades_path,
    readout=[
        "- Grid only tests `entry_next_body_min = 0.0` variants.\n",
        "- Goal: push V3-FIN train from 12.79% to >=15% while keeping pre/post positive.\n",
        "- Check train rows first, then reject if pre turns negative or trade count collapses.\n",
    ],
)
print(f"saved {report_path}")
