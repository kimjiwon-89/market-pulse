"""Early-fail focused 10-test loop for W4/V3-FIN.

Starts from the useful adaptive finding: require next-day body >= 1%.
Then tests nearby thresholds and overheat filters to reduce early/stop losses
without killing train/post sample.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-earlyfail-improvement10.md
  .Codex/reports/2026-05-27_w4-v3fin-earlyfail-improvement10-trades.csv
"""
import os

os.environ.setdefault("MP_BACKTEST_CPU_LIMIT", "0.4")
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd

import backtest_v3fin_portfolio_sample_expansion as sim


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-earlyfail-improvement10.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-earlyfail-improvement10-trades.csv"

BASE = {
    "delay": 5,
    "entry_loc": 0.55,
    "entry_ma20_min": 0.02,
    "entry_next_body_min": 0.01,
    "top_n": 50,
}

TESTS = [
    ("ef01_next005", "loosen next-body floor to recover sample", {**BASE, "entry_next_body_min": 0.005}),
    ("ef02_next010_base", "adaptive04 core: next-body >= 1%", BASE),
    ("ef03_next015", "tighten next-body floor", {**BASE, "entry_next_body_min": 0.015}),
    ("ef04_next020", "tighten next-body floor more", {**BASE, "entry_next_body_min": 0.020}),
    ("ef05_next010_ma60_055", "cut extreme MA60 extension", {**BASE, "ma60_dist_max": 0.55}),
    ("ef06_next010_ma60_040", "cut stronger MA60 extension", {**BASE, "ma60_dist_max": 0.40}),
    ("ef07_next010_ma60_030", "cut aggressive MA60 extension", {**BASE, "ma60_dist_max": 0.30}),
    ("ef08_next010_range040", "cut wide 20d range", {**BASE, "range20_max": 0.40}),
    ("ef09_next010_range035", "cut tighter 20d range", {**BASE, "range20_max": 0.35}),
    ("ef10_next010_vol07", "mild volume floor", {**BASE, "vol_exp_min": 0.70}),
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
    value += train["n"] * 0.75 + post_n * 0.75 + (pre["n"] if pre else 0) * 0.05
    value += train["avg"] * 160 + post_avg * 80
    value += train["win"] * 20
    value -= early_rate * 30 + stop_rate * 12
    value -= abs(min(0, train["worst"])) * 160
    if train["n"] < 25:
        value -= 15
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


def compare_train_features(trades):
    train = trades[trades["period"] == "train"].copy()
    if len(train) == 0:
        return []
    train["early_or_stop"] = train["reason"].str.contains("EARLY_FAIL", na=False) | (train["reason"] == "STOP")
    good = train[train["ret"] > 0]
    bad = train[train["early_or_stop"]]
    rows = []
    for col in ["sig_range20", "sig_ret60", "entry_vol_exp", "entry_ma20_dist", "next_body_ret", "max_20d", "min_10d"]:
        if col not in train.columns or len(good) == 0 or len(bad) == 0:
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


def params_text(params):
    return ", ".join(f"{k}={params[k]}" for k in sorted(params))


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
                "features": compare_train_features(trades),
            }
        )

    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    ranked = sorted(summaries, key=lambda x: x["score"], reverse=True)
    lines = [
        "# W4 V3-FIN Early-Fail Improvement 10 Tests\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {sim.CAPITAL:,}\n",
        f"position_cash: {sim.POSITION_CASH:,}\n",
        f"cpu_limit: {os.getenv('MP_BACKTEST_CPU_LIMIT', '0.4')}\n",
        "mode: early-fail focused sequential tests from adaptive04 finding\n\n",
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

    lines.extend(["\n## Feature Readout From Best Test\n\n"])
    best = ranked[0]
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
            "- If next-body threshold improves quality but sample falls too hard, use 0.5% or 1.0%, not 2.0%.\n",
            "- If MA60/range filters improve train but hurt post/sample, keep them diagnostic only.\n",
            "- Next loop should modify exit rules for STOP-heavy trades if entry filters stop helping.\n",
            f"- Trades: `{OUT_CSV}`\n",
        ]
    )

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
