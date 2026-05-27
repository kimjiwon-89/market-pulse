"""Regime router test for W4/V3-FIN current candidate.

Uses the same signal-date regime model from `backtest_v3fin_regime_breakdown.py`.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-regime-router.md
  .Codex/reports/2026-05-27_w4-v3fin-regime-router-trades.csv
"""
import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority
import pandas as pd


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-regime-router.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-regime-router-trades.csv"
SOURCE_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-regime-breakdown-trades.csv"

PERIODS = [
    ("pre", "2012-01-01", "2022-04-30"),
    ("train_to_2025_06", "2022-05-01", "2025-06-30"),
    ("train_to_2025_07", "2022-05-01", "2025-07-31"),
    ("post_from_2025_07", "2025-07-01", "2026-05-20"),
    ("post_from_2025_08", "2025-08-01", "2026-05-20"),
]

POLICIES = {
    "current_best": {
        "BULL": {"risk": 1.0, "allow": True},
        "SIDEWAYS": {"risk": 1.0, "allow": True},
        "BEAR": {"risk": 1.0, "allow": True},
        "CRASH": {"risk": 1.0, "allow": True},
    },
    "router_cash_bear": {
        "BULL": {"risk": 1.0, "allow": True},
        "SIDEWAYS": {"risk": 1.0, "allow": True},
        "BEAR": {"risk": 0.0, "allow": False},
        "CRASH": {"risk": 0.0, "allow": False},
    },
    "router_half_sideways": {
        "BULL": {"risk": 1.0, "allow": True},
        "SIDEWAYS": {"risk": 0.5, "allow": True},
        "BEAR": {"risk": 0.0, "allow": False},
        "CRASH": {"risk": 0.0, "allow": False},
    },
    "router_bull_only": {
        "BULL": {"risk": 1.0, "allow": True},
        "SIDEWAYS": {"risk": 0.0, "allow": False},
        "BEAR": {"risk": 0.0, "allow": False},
        "CRASH": {"risk": 0.0, "allow": False},
    },
}


def metric(s):
    if len(s) == 0:
        return None
    s = s.copy()
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly = s.groupby("ym")["ret"].sum()
    return {
        "avg": monthly.mean(),
        "total": (1 + s["ret"]).prod() - 1,
        "worst": monthly.min(),
        "n": len(s),
        "win": (s["ret"] > 0).mean(),
        "early": int(s["reason"].str.contains("EARLY_FAIL").sum()),
        "stop": int((s["reason"] == "STOP").sum()),
    }


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    source = pd.read_csv(SOURCE_CSV, parse_dates=["signal_date", "entry_check_date", "entry_date", "exit_date"])
    base_trades = source[source["variant"] == "best_ef_close6"].copy()
    base_trades["raw_ret"] = base_trades["ret"].astype(float)

    frames = []
    for label, policy in POLICIES.items():
        rows = []
        for _, row in base_trades.iterrows():
            route = policy[row["regime"]]
            if not route["allow"]:
                continue
            item = row.to_dict()
            item["policy"] = label
            item["risk_budget"] = route["risk"]
            item["ret"] = float(row["raw_ret"]) * route["risk"]
            rows.append(item)
        frames.append(pd.DataFrame(rows))

    trades = pd.concat(frames, ignore_index=True)
    trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    rows = []
    ranks = []
    for policy in trades["policy"].unique():
        pt = trades[trades["policy"] == policy]
        metrics = {}
        for period, start, end in PERIODS:
            s = pt[(pd.to_datetime(pt["signal_date"]) >= pd.Timestamp(start)) & (pd.to_datetime(pt["signal_date"]) <= pd.Timestamp(end))]
            m = metric(s)
            metrics[period] = m
            if m:
                rows.append([policy, period, m])
        pre = metrics.get("pre")
        train = metrics.get("train_to_2025_07")
        post = metrics.get("post_from_2025_07")
        if pre and train:
            pass_core = pre["avg"] > 0 and train["avg"] >= 0.40 and train["worst"] >= -0.13 and train["win"] >= 0.70
            pass_post = post is not None and post["avg"] >= 0
            score = train["avg"] + min(pre["avg"], 0.20) + train["win"] * 0.20 + train["worst"]
            if pass_post:
                score += 0.10
            elif post:
                score += post["avg"]
            ranks.append([policy, pass_core, pass_post, score, pre, train, post])
    ranks.sort(key=lambda x: (x[1], x[2], x[3]), reverse=True)

    lines = [
        "# W4 V3-FIN Regime Router\n\n",
        f"date: {REPORT_DATE}\n",
        "pre: 2012-01-01~2022-04-30\n",
        "train: 2022-05-01~2025-07-31\n",
        "post: 2025-08-01~2026-05-20\n\n",
        "## Ranking\n\n",
        "| rank | policy | pass40 | post>=0 | score | pre avg | train avg | train worst | train win | post avg | N train | N post |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (policy, pass_core, pass_post, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {policy} | {'Y' if pass_core else 'N'} | {'Y' if pass_post else 'N'} | {score:.4f} | "
            f"{pct(pre['avg'])} | {pct(train['avg'])} | {pct(train['worst'])} | {pct(train['win'])} | "
            f"{pct(post['avg'] if post else None)} | {train['n']} | {post['n'] if post else 0} |\n"
        )

    lines.extend([
        "\n## Full Result\n\n",
        "| policy | period | avg monthly | total | worst | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for policy, period, m in rows:
        lines.append(
            f"| {policy} | {period} | {pct(m['avg'])} | {pct(m['total'])} | {pct(m['worst'])} | "
            f"{m['n']} | {pct(m['win'])} | {m['early']} | {m['stop']} |\n"
        )

    lines.extend([
        "\n## Regime Counts\n\n",
        "| policy | period | regime | N | avg ret |\n",
        "|---|---|---|---:|---:|\n",
    ])
    for (policy, period, regime), s in trades.groupby(["policy", "period", "regime"]):
        lines.append(f"| {policy} | {period} | {regime} | {len(s)} | {pct(s['ret'].mean())} |\n")

    lines.extend([
        "\n## Readout\n\n",
        f"- Source trades: `{SOURCE_CSV}` filtered to `ef_close6_cond_ext60`.\n",
        "- Current sample has no BEAR/CRASH trades after existing `both_ma20` regime gate.\n",
        "- Router mainly changes SIDEWAYS exposure and risk budget.\n",
        "- Strict SIDEWAYS entry needs separate full re-simulation; this quick pass only filters/scales existing current-best trades.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ])

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
