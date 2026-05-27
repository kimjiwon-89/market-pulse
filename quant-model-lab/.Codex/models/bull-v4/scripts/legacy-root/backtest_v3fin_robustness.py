"""Robustness pass for V3-FIN-NB-SHADOW08."""
from collections import defaultdict

import pandas as pd

import backtest_v3fin_early_fail as base

COMMON = {
    "entry_next_body_min": 0.0,
    "entry_shadow": 0.08,
    "top_n": 10,
    "cadence_days": 5,
    "stop": -0.18,
    "ef": -0.08,
    "ts": 0.20,
    "tp": 0.20,
    "mh": 30,
}


def metric_by_signal(trades, start, end):
    if trades is None or len(trades) == 0:
        return None
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start))
        & (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ].copy()
    if len(s) == 0:
        return None
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly = s.groupby("ym")["ret"].sum()
    return {
        "avg": monthly.mean(),
        "total": (1 + s["ret"]).prod() - 1,
        "worst": monthly.min(),
        "n": len(s),
        "win": (s["ret"] > 0).mean(),
        "early": int((s["reason"] == "EARLY_FAIL").sum()),
    }


variants = []
for delay in [3, 5, 7]:
    variants.append((f"shadow08_delay{delay}", {**COMMON, "delay": delay}))

# One simple pre early-fail blocker probe: require stronger signal-day ret60.
for ret60_min in [0.30, 0.40, 0.50]:
    label = f"shadow08_ret60min{int(ret60_min*100)}"
    variants.append((label, {**COMMON, "delay": 5, "sig_ret60_min": ret60_min}))


def run_with_optional_sig_filter(label, params):
    sig_ret60_min = params.pop("sig_ret60_min", None)
    trades = base.run_bt(label, **params)
    if sig_ret60_min is None or len(trades) == 0:
        return trades
    return trades[trades["sig_ret60"] >= sig_ret60_min].copy()


rows = []
frames = []
for label, params in variants:
    trades = run_with_optional_sig_filter(label, dict(params))
    frames.append(trades)
    periods = [
        ("pre", base.PRE_START, base.PRE_END),
        ("train_to_2025_06", base.TRAIN_START, "2025-06-30"),
        ("train_to_2025_07", base.TRAIN_START, "2025-07-31"),
        ("post_from_2025_07", "2025-07-01", "2026-05-20"),
        ("post_from_2025_08", base.POST_START, base.POST_END),
    ]
    for period, start, end in periods:
        m = metric_by_signal(trades, start, end)
        if m is None:
            rows.append([label, period, None, None, None, 0, None, 0])
        else:
            rows.append([label, period, m["avg"], m["total"], m["worst"], m["n"], m["win"], m["early"]])

out = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
trades_path = ".Codex/reports/2026-05-26_w4-v3fin-robustness-trades.csv"
out.to_csv(trades_path, index=False, encoding="utf-8-sig")

lines = [
    "# W4 V3-FIN-NB-SHADOW08 Robustness Pass\n\n",
    "date: 2026-05-26\n\n",
    f"pre: {base.PRE_START}~{base.PRE_END}\n",
    f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
    f"post: {base.POST_START}~{base.POST_END}\n\n",
    "## Result\n\n",
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

best = out[out["variant"] == "shadow08_delay5"].copy()
pre_early = best[(best["period"] == "pre") & (best["reason"] == "EARLY_FAIL")]
lines.extend(
    [
        "\n## Pre Early-Fail Rows For Current Candidate\n\n",
        "| signal | code | name | entry | exit | ret |\n",
        "|---|---|---|---|---|---:|\n",
    ]
)
for _, r in pre_early.iterrows():
    lines.append(
        f"| {str(r['signal_date'])[:10]} | {r['asset_code']} | {r['asset_name']} | "
        f"{str(r['entry_date'])[:10]} | {str(r['exit_date'])[:10]} | {float(r['ret'])*100:.2f}% |\n"
    )

lines.extend(
    [
        "\n## Readout\n\n",
        "- `shadow08_delay5` is the current candidate.\n",
        "- Delay sensitivity must keep train >=15% under both train-end splits.\n",
        "- Ret60-min probes are only simple pre early-fail blockers; reject if train/post collapse.\n",
        f"- Trades: `{trades_path}`\n",
    ]
)

report_path = ".Codex/reports/2026-05-26_w4-v3fin-robustness.md"
with open(report_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"saved {report_path}")
