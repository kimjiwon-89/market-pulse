"""Risk-control grid for V3-FIN-NB-BOTH-MA20.

Goal:
  Raise win rate and reduce worst month before optimizing entry timing.

Writes:
  .Codex/reports/2026-05-26_w4-v3fin-risk-grid.md
  .Codex/reports/2026-05-26_w4-v3fin-risk-grid-trades.csv
"""
import pandas as pd

import backtest_v3fin_early_fail as base


COMMON = {
    "entry_next_body_min": 0.0,
    "entry_shadow": 0.08,
    "top_n": 10,
    "cadence_days": 5,
    "delay": 5,
    "ts": 0.20,
    "tp": 0.20,
    "mh": 30,
    "regime": "both_ma20",
}


VARIANTS = [
    ("base_stop18_ef8_efd3", {**COMMON, "stop": -0.18, "ef": -0.08, "efd": 3}),
    ("stop15_ef8_efd3", {**COMMON, "stop": -0.15, "ef": -0.08, "efd": 3}),
    ("stop12_ef8_efd3", {**COMMON, "stop": -0.12, "ef": -0.08, "efd": 3}),
    ("stop15_ef6_efd3", {**COMMON, "stop": -0.15, "ef": -0.06, "efd": 3}),
    ("stop12_ef6_efd3", {**COMMON, "stop": -0.12, "ef": -0.06, "efd": 3}),
    ("stop15_ef5_efd3", {**COMMON, "stop": -0.15, "ef": -0.05, "efd": 3}),
    ("stop12_ef5_efd3", {**COMMON, "stop": -0.12, "ef": -0.05, "efd": 3}),
    ("stop15_ef6_efd5", {**COMMON, "stop": -0.15, "ef": -0.06, "efd": 5}),
    ("stop12_ef6_efd5", {**COMMON, "stop": -0.12, "ef": -0.06, "efd": 5}),
    ("stop12_ef5_efd5", {**COMMON, "stop": -0.12, "ef": -0.05, "efd": 5}),
    ("stop12_ef6_ma20dist2", {**COMMON, "stop": -0.12, "ef": -0.06, "efd": 3, "entry_ma20_min": 0.02}),
    ("stop12_ef6_ma20dist5", {**COMMON, "stop": -0.12, "ef": -0.06, "efd": 3, "entry_ma20_min": 0.05}),
]


PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train_to_2025_06", base.TRAIN_START, "2025-06-30"),
    ("train_to_2025_07", base.TRAIN_START, "2025-07-31"),
    ("post_from_2025_07", "2025-07-01", base.POST_END),
    ("post_from_2025_08", base.POST_START, base.POST_END),
]


def metric_by_signal_date(trades, start, end):
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


def format_pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    rows = []
    score_rows = []
    trade_frames = []

    for label, params in VARIANTS:
        trades = base.run_bt(label, **params)
        trade_frames.append(trades)
        metrics = {}
        for period, start, end in PERIODS:
            m = metric_by_signal_date(trades, start, end)
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
            score = (
                train["avg"]
                + train["win"] * 0.20
                + min(pre["avg"], 0.15)
                + (post["avg"] if post else 0) * 0.20
                + train["worst"]
            )
            score_rows.append([label, pass_core, score, pre, train, post])

    trades_path = ".Codex/reports/2026-05-26_w4-v3fin-risk-grid-trades.csv"
    out = pd.concat(trade_frames, ignore_index=True) if trade_frames else pd.DataFrame()
    out.to_csv(trades_path, index=False, encoding="utf-8-sig")

    score_rows.sort(key=lambda x: (x[1], x[2]), reverse=True)

    lines = [
        "# W4 V3-FIN Risk Grid\n\n",
        "date: 2026-05-26\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass | score | pre avg | train avg | train worst | train win | post avg | N train |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, pass_core, score, pre, train, post) in enumerate(score_rows, 1):
        lines.append(
            f"| {i} | {label} | {'Y' if pass_core else 'N'} | {score:.4f} | "
            f"{format_pct(pre['avg'])} | {format_pct(train['avg'])} | {format_pct(train['worst'])} | "
            f"{format_pct(train['win'])} | {format_pct(post['avg'] if post else None)} | {train['n']} |\n"
        )

    lines.extend(
        [
            "\n## Full Result\n\n",
            "| variant | period | avg monthly | total | worst | N | win | early fail | stop |\n",
            "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
        ]
    )
    for label, period, avg, total, worst, n, win, early, stop in rows:
        if avg is None:
            lines.append(f"| {label} | {period} | - | - | - | 0 | - | 0 | 0 |\n")
        else:
            lines.append(
                f"| {label} | {period} | {avg*100:.2f}% | {total*100:.2f}% | "
                f"{worst*100:.2f}% | {n} | {win*100:.1f}% | {early} | {stop} |\n"
            )

    lines.extend(
        [
            "\n## Readout\n\n",
            "- Goal: improve win rate and cap worst month near -12% before entry-timing optimization.\n",
            "- Promote only if train avg stays >=15%, pre avg stays positive, and train worst improves versus -18.30%.\n",
            f"- Trades: `{trades_path}`\n",
        ]
    )

    report_path = ".Codex/reports/2026-05-26_w4-v3fin-risk-grid.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {report_path}")


if __name__ == "__main__":
    main()
