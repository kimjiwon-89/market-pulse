"""Applied W4/V3-FIN improvement retest.

Applies the current best quality improvement:
  - next-day body >= 1%
  - signal range20 <= 40%

Then retests 10 nearby variants to recover sample or reduce overextension.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-applied-improvement10.md
  .Codex/reports/2026-05-27_w4-v3fin-applied-improvement10-trades.csv
"""
import os

os.environ.setdefault("MP_BACKTEST_CPU_LIMIT", "0.4")
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd

import backtest_v3fin_portfolio_sample_expansion as sim


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-applied-improvement10.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-applied-improvement10-trades.csv"

BASE = {
    "delay": 5,
    "entry_loc": 0.55,
    "entry_ma20_min": 0.02,
    "entry_next_body_min": 0.01,
    "range20_max": 0.40,
    "top_n": 50,
}

TESTS = [
    ("ap01_range040_top50", "applied improvement baseline", BASE),
    ("ap02_range040_top60", "recover sample by wider daily rank", {**BASE, "top_n": 60}),
    ("ap03_range040_top80", "recover sample more by wider daily rank", {**BASE, "top_n": 80}),
    ("ap04_range042_top50", "slightly loosen range cap", {**BASE, "range20_max": 0.42}),
    ("ap05_range045_top50", "loosen range cap to old relaxed level", {**BASE, "range20_max": 0.45}),
    ("ap06_range040_next005", "loosen next body to 0.5% with range cap", {**BASE, "entry_next_body_min": 0.005}),
    ("ap07_range040_next015", "tighten next body to 1.5% with range cap", {**BASE, "entry_next_body_min": 0.015}),
    ("ap08_range040_ma60_055", "add mild MA60 extension cap", {**BASE, "ma60_dist_max": 0.55}),
    ("ap09_range040_ret60max100", "cut extreme ret60 extension above 100%", {**BASE, "ret60_max": 1.00}),
    ("ap10_range040_ret60max080", "cut ret60 extension above 80%", {**BASE, "ret60_max": 0.80}),
]


def pct(v):
    return "-" if v is None or pd.isna(v) else f"{v * 100:.2f}%"


def metric_for(trades, period):
    for name, start, end in sim.PERIODS:
        if name == period:
            return sim.metric(trades, start, end)
    return None


def score(pre, train, post):
    if not train:
        return -9999.0
    early_rate = train["early"] / max(train["n"], 1)
    stop_rate = train["stop"] / max(train["n"], 1)
    post_avg = post["avg"] if post else -0.2
    post_n = post["n"] if post else 0
    value = 0.0
    value += train["n"] * 0.65 + post_n * 0.70 + (pre["n"] if pre else 0) * 0.04
    value += train["avg"] * 180 + post_avg * 90
    value += train["win"] * 24
    value -= early_rate * 28 + stop_rate * 14
    value -= abs(min(0, train["worst"])) * 180
    if train["n"] < 25:
        value -= 12
    if post and post["avg"] < 0:
        value -= 25
    return value


def describe(m):
    if not m:
        return "no trades"
    early_rate = m["early"] / max(m["n"], 1)
    stop_rate = m["stop"] / max(m["n"], 1)
    return (
        f"N={m['n']}, avg={pct(m['avg'])}, worst={pct(m['worst'])}, "
        f"win={pct(m['win'])}, early={m['early']}({pct(early_rate)}), "
        f"stop={m['stop']}({pct(stop_rate)})"
    )


def params_text(params):
    return ", ".join(f"{k}={params[k]}" for k in sorted(params))


def feature_summary(trades):
    train = trades[trades["period"] == "train"].copy()
    if len(train) == 0:
        return []
    train["bad"] = train["reason"].str.contains("EARLY_FAIL", na=False) | (train["reason"] == "STOP")
    good = train[train["ret"] > 0]
    bad = train[train["bad"]]
    rows = []
    for col in ["sig_range20", "sig_ret60", "entry_ma20_dist", "entry_vol_exp", "next_body_ret", "min_10d", "max_20d"]:
        if len(good) == 0 or len(bad) == 0:
            continue
        rows.append(
            {
                "feature": col,
                "good_median": good[col].median(),
                "bad_median": bad[col].median(),
                "good_mean": good[col].mean(),
                "bad_mean": bad[col].mean(),
            }
        )
    return rows


def main():
    frames = []
    summaries = []
    for label, intent, params in TESTS:
        print(f"running {label}: {params_text(params)}")
        trades = sim.run_variant(label, params)
        frames.append(trades)
        pre = metric_for(trades, "pre")
        train = metric_for(trades, "train")
        post = metric_for(trades, "post")
        summaries.append(
            {
                "label": label,
                "intent": intent,
                "params": params,
                "pre": pre,
                "train": train,
                "post": post,
                "score": score(pre, train, post),
                "features": feature_summary(trades),
            }
        )

    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    ranked = sorted(summaries, key=lambda x: x["score"], reverse=True)
    lines = [
        "# W4 V3-FIN Applied Improvement 10-Test Report\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {sim.CAPITAL:,}\n",
        f"position_cash: {sim.POSITION_CASH:,}\n",
        f"cpu_limit: {os.getenv('MP_BACKTEST_CPU_LIMIT', '0.4')}\n",
        "mode: apply next_body >= 1% + range20 <= 40%, then retest variants sequentially\n\n",
        "## Ranking\n\n",
        "| rank | test | score | train N | train avg | train worst | train win | train early | train stop | post N | post avg | post win |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, item in enumerate(ranked, 1):
        train = item["train"]
        post = item["post"]
        early_rate = train["early"] / max(train["n"], 1) if train else None
        stop_rate = train["stop"] / max(train["n"], 1) if train else None
        lines.append(
            f"| {i} | {item['label']} | {item['score']:.2f} | {train['n'] if train else 0} | "
            f"{pct(train['avg'] if train else None)} | {pct(train['worst'] if train else None)} | "
            f"{pct(train['win'] if train else None)} | {pct(early_rate)} | {pct(stop_rate)} | "
            f"{post['n'] if post else 0} | {pct(post['avg'] if post else None)} | {pct(post['win'] if post else None)} |\n"
        )

    lines.extend(
        [
            "\n## Test Log\n\n",
            "| test | intent | params | train | post |\n",
            "|---|---|---|---|---|\n",
        ]
    )
    for item in summaries:
        lines.append(
            f"| {item['label']} | {item['intent']} | `{params_text(item['params'])}` | "
            f"{describe(item['train'])} | {describe(item['post'])} |\n"
        )

    best = ranked[0]
    lines.extend(["\n## Feature Readout From Best Test\n\n"])
    lines.append(f"- Best: `{best['label']}` with `{params_text(best['params'])}`.\n")
    lines.append("| feature | winner median | early/stop median | winner mean | early/stop mean |\n")
    lines.append("|---|---:|---:|---:|---:|\n")
    for row in best["features"]:
        lines.append(
            f"| {row['feature']} | {pct(row['good_median'])} | {pct(row['bad_median'])} | "
            f"{pct(row['good_mean'])} | {pct(row['bad_mean'])} |\n"
        )

    lines.extend(
        [
            "\n## Readout\n\n",
            "- This report tests the applied improvement, not a broad search.\n",
            "- If top_n expansion has no effect, ranking bottleneck is not daily candidate depth.\n",
            "- If ret60_max helps, prior W4 momentum may be overextended rather than stronger.\n",
            f"- Trades: `{OUT_CSV}`\n",
        ]
    )

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
