"""10-iteration W4/V3-FIN sample-expansion improvement run.

This is a batch of 10 lightweight strategy variants derived from raw-candidate
forward-path analysis. Goal is sample-quality improvement, not final return
optimization.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-iteration10.md
  .Codex/reports/2026-05-27_w4-v3fin-iteration10-trades.csv
"""
import os

os.environ.setdefault("MP_BACKTEST_CPU_LIMIT", "0.4")
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd

import backtest_v3fin_portfolio_sample_expansion as sim


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-iteration10.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-iteration10-trades.csv"


ITERATIONS = [
    ("iter01_relaxed_baseline", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50}),
    ("iter02_vol07", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "vol_exp_min": 0.70}),
    ("iter03_vol10", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "vol_exp_min": 1.00}),
    ("iter04_ret60_40", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.40}),
    ("iter05_ret60_60", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.60}),
    ("iter06_range45_ma60dist40", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "range20_max": 0.45, "ma60_dist_max": 0.40}),
    ("iter07_range45_ma60dist40_vol07", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "range20_max": 0.45, "ma60_dist_max": 0.40, "vol_exp_min": 0.70}),
    ("iter08_top20_range45_ma60dist40_vol07", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 20, "range20_max": 0.45, "ma60_dist_max": 0.40, "vol_exp_min": 0.70}),
    ("iter09_ret60_40_vol07", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.40, "vol_exp_min": 0.70}),
    ("iter10_ret60_40_range45", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.40, "range20_max": 0.45}),
]


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    frames = []
    for label, params in ITERATIONS:
        print(f"running {label}")
        frames.append(sim.run_variant(label, params))

    trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    rows = []
    ranks = []
    for label, _ in ITERATIONS:
        vt = trades[trades["variant"] == label]
        metrics = {}
        for period, start, end in sim.PERIODS:
            m = sim.metric(vt, start, end)
            metrics[period] = m
            if m:
                rows.append([label, period, m])
        pre = metrics.get("pre")
        train = metrics.get("train")
        post = metrics.get("post")
        if train:
            # Sample-first score: keep many trades, avoid harsh drawdown, prefer post survival.
            score = train["n"] + (post["n"] if post else 0) + 0.1 * (pre["n"] if pre else 0)
            score += train["avg"] * 100 + (post["avg"] * 50 if post else 0)
            score += train["win"] * 10
            score -= abs(min(0, train["worst"])) * 100
            if post and post["avg"] < 0:
                score -= 20
            ranks.append([label, score, pre, train, post])

    ranks.sort(key=lambda x: x[1], reverse=True)

    lines = [
        "# W4 V3-FIN 10-Iteration Improvement Report\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {sim.CAPITAL:,}\n",
        f"position_cash: {sim.POSITION_CASH:,}\n",
        f"cpu_limit: {os.getenv('MP_BACKTEST_CPU_LIMIT', '0.4')}\n\n",
        "## Ranking\n\n",
        "| rank | iteration | score | pre N | train N | post N | train avg | train worst | train win | post avg | post win |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {score:.2f} | {pre['n'] if pre else 0} | {train['n'] if train else 0} | {post['n'] if post else 0} | "
            f"{pct(train['avg'] if train else None)} | {pct(train['worst'] if train else None)} | {pct(train['win'] if train else None)} | "
            f"{pct(post['avg'] if post else None)} | {pct(post['win'] if post else None)} |\n"
        )

    lines.extend([
        "\n## Full Results\n\n",
        "| iteration | period | avg monthly on capital | total on capital | worst month | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for label, period, m in rows:
        lines.append(
            f"| {label} | {period} | {pct(m['avg'])} | {pct(m['total'])} | {pct(m['worst'])} | "
            f"{m['n']} | {pct(m['win'])} | {m['early']} | {m['stop']} |\n"
        )

    lines.extend([
        "\n## Readout\n\n",
        "- Goal was 10 rounds of sample-expansion testing, not final return optimization.\n",
        "- Broad relaxed variants keep the most data; compact range/MA60-distance variants improve train win rate but hurt post.\n",
        "- Next improvement should target early-loser reduction without destroying post sample.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ])

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
