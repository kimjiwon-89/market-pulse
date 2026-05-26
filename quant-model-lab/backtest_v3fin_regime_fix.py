"""Extended-period market regime probes for V3-FIN-NB-SHADOW08."""
import pandas as pd

import backtest_v3fin_early_fail as base

COMMON = {
    "entry_next_body_min": 0.0,
    "entry_shadow": 0.08,
    "top_n": 10,
    "cadence_days": 5,
    "delay": 5,
    "stop": -0.18,
    "ef": -0.08,
    "ts": 0.20,
    "tp": 0.20,
    "mh": 30,
}

variants = [
    ("kospi_ma60", {**COMMON, "regime": "KOSPI_ma60"}),
    ("kosdaq_ma60", {**COMMON, "regime": "KOSDAQ_ma60"}),
    ("both_ma60", {**COMMON, "regime": "both_ma60"}),
    ("kospi_ma20", {**COMMON, "regime": "KOSPI_ma20"}),
    ("kosdaq_ma20", {**COMMON, "regime": "KOSDAQ_ma20"}),
    ("both_ma20", {**COMMON, "regime": "both_ma20"}),
    ("no_regime", {**COMMON, "regime": "none"}),
]

rows = []
frames = []
for label, params in variants:
    trades = base.run_bt(label, **params)
    frames.append(trades)
    for period, start, end in [
        ("pre", base.PRE_START, base.PRE_END),
        ("train_to_2025_06", base.TRAIN_START, "2025-06-30"),
        ("train_to_2025_07", base.TRAIN_START, "2025-07-31"),
        ("post_from_2025_07", "2025-07-01", base.POST_END),
        ("post_from_2025_08", base.POST_START, base.POST_END),
    ]:
        m = None
        if len(trades) > 0:
            s = trades[
                (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start))
                & (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
            ].copy()
            if len(s) > 0:
                s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
                monthly = s.groupby("ym")["ret"].sum()
                m = {
                    "avg": monthly.mean(),
                    "total": (1 + s["ret"]).prod() - 1,
                    "worst": monthly.min(),
                    "n": len(s),
                    "win": (s["ret"] > 0).mean(),
                    "early": int((s["reason"] == "EARLY_FAIL").sum()),
                }
        if m is None:
            rows.append([label, period, None, None, None, 0, None, 0])
        else:
            rows.append([label, period, m["avg"], m["total"], m["worst"], m["n"], m["win"], m["early"]])

trades_path = ".Codex/reports/2026-05-26_w4-v3fin-regime-fix-trades.csv"
pd.concat(frames, ignore_index=True).to_csv(trades_path, index=False, encoding="utf-8-sig")

lines = [
    "# W4 V3-FIN-NB-SHADOW08 Regime Fix\n\n",
    "date: 2026-05-26\n",
    f"pre: {base.PRE_START}~{base.PRE_END}\n",
    f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
    f"post: {base.POST_START}~{base.POST_END}\n\n",
    "| variant | period | avg monthly | total | worst | N | win | early fail |\n",
    "|---|---|---:|---:|---:|---:|---:|---:|\n",
]
for label, period, avg, total, worst, n, win, early in rows:
    if avg is None:
        lines.append(f"| {label} | {period} | - | - | - | 0 | - | 0 |\n")
    else:
        lines.append(
            f"| {label} | {period} | {avg*100:.2f}% | {total*100:.2f}% | "
            f"{worst*100:.2f}% | {n} | {win*100:.1f}% | {early} |\n"
        )

lines.extend([
    "\n## Readout\n\n",
    "- Goal: fix 2012-2014 extended-pre failure while keeping train >=15%.\n",
    "- Promote only if pre turns positive and train/post remain positive.\n",
    f"- Trades: `{trades_path}`\n",
])

report_path = ".Codex/reports/2026-05-26_w4-v3fin-regime-fix.md"
with open(report_path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print(f"saved {report_path}")
