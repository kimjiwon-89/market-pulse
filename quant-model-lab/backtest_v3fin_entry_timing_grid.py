"""Entry-timing grid after risk-control improvement.

Base candidate:
  V3-FIN-NB-BOTH-MA20 + stop -12% + early fail -6% + entry MA20 dist >= 5%.

Writes:
  .Codex/reports/2026-05-26_w4-v3fin-entry-timing-grid.md
  .Codex/reports/2026-05-26_w4-v3fin-entry-timing-grid-trades.csv
"""
import pandas as pd

import backtest_v3fin_early_fail as base


COMMON = {
    "entry_next_body_min": 0.0,
    "entry_shadow": 0.08,
    "entry_ma20_min": 0.05,
    "top_n": 10,
    "cadence_days": 5,
    "stop": -0.12,
    "ef": -0.06,
    "efd": 3,
    "ts": 0.20,
    "tp": 0.20,
    "mh": 30,
    "regime": "both_ma20",
}


VARIANTS = [
    ("d4_base", {**COMMON, "delay": 4}),
    ("d5_base", {**COMMON, "delay": 5}),
    ("d6_base", {**COMMON, "delay": 6}),
    ("d5_nextbody1", {**COMMON, "delay": 5, "entry_next_body_min": 0.01}),
    ("d5_nextbody2", {**COMMON, "delay": 5, "entry_next_body_min": 0.02}),
    ("d5_entrybody1", {**COMMON, "delay": 5, "entry_body": 0.01}),
    ("d5_entrybody2", {**COMMON, "delay": 5, "entry_body": 0.02}),
    ("d5_drawdown0", {**COMMON, "delay": 5, "entry_drawdown": 0.0}),
    ("d5_loc70", {**COMMON, "delay": 5, "entry_loc": 0.70}),
    ("d5_shadow6", {**COMMON, "delay": 5, "entry_shadow": 0.06}),
]


PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train_to_2025_06", base.TRAIN_START, "2025-06-30"),
    ("train_to_2025_07", base.TRAIN_START, "2025-07-31"),
    ("post_from_2025_07", "2025-07-01", base.POST_END),
    ("post_from_2025_08", base.POST_START, base.POST_END),
]


def metric(trades, start, end):
    if len(trades) == 0:
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
        "stop": int((s["reason"] == "STOP").sum()),
    }


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    rows = []
    ranks = []
    frames = []

    for label, params in VARIANTS:
        trades = base.run_bt(label, **params)
        frames.append(trades)
        metrics = {}
        for period, start, end in PERIODS:
            m = metric(trades, start, end)
            metrics[period] = m
            if m is None:
                rows.append([label, period, None, None, None, 0, None, 0, 0])
            else:
                rows.append([label, period, m["avg"], m["total"], m["worst"], m["n"], m["win"], m["early"], m["stop"]])

        pre = metrics["pre"]
        train = metrics["train_to_2025_07"]
        post = metrics["post_from_2025_07"]
        if pre and train:
            pass_core = pre["avg"] > 0 and train["avg"] >= 0.15 and train["worst"] >= -0.13
            post_penalty = -0.05 if post and post["avg"] < 0 else 0
            score = train["avg"] + train["win"] * 0.2 + min(pre["avg"], 0.15) + train["worst"] + post_penalty
            ranks.append([label, pass_core, score, pre, train, post])

    trades_path = ".Codex/reports/2026-05-26_w4-v3fin-entry-timing-grid-trades.csv"
    pd.concat(frames, ignore_index=True).to_csv(trades_path, index=False, encoding="utf-8-sig")
    ranks.sort(key=lambda x: (x[1], x[2]), reverse=True)

    lines = [
        "# W4 V3-FIN Entry Timing Grid\n\n",
        "date: 2026-05-26\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass | score | pre avg | train avg | train worst | train win | post avg | N train |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, pass_core, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {'Y' if pass_core else 'N'} | {score:.4f} | "
            f"{pct(pre['avg'])} | {pct(train['avg'])} | {pct(train['worst'])} | "
            f"{pct(train['win'])} | {pct(post['avg'] if post else None)} | {train['n']} |\n"
        )

    lines.extend([
        "\n## Full Result\n\n",
        "| variant | period | avg monthly | total | worst | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for label, period, avg, total, worst, n, win, early, stop in rows:
        if avg is None:
            lines.append(f"| {label} | {period} | - | - | - | 0 | - | 0 | 0 |\n")
        else:
            lines.append(
                f"| {label} | {period} | {avg*100:.2f}% | {total*100:.2f}% | "
                f"{worst*100:.2f}% | {n} | {win*100:.1f}% | {early} | {stop} |\n"
            )

    lines.extend([
        "\n## Readout\n\n",
        "- Goal: recover/raise return after risk controls while keeping worst month near -12% or better.\n",
        "- Delay 5 remains baseline unless nearby timing clearly improves pre/train/post together.\n",
        f"- Trades: `{trades_path}`\n",
    ])

    report_path = ".Codex/reports/2026-05-26_w4-v3fin-entry-timing-grid.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {report_path}")


if __name__ == "__main__":
    main()
