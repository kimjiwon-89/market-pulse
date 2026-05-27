"""Adaptive 10-iteration W4/V3-FIN improvement loop.

Each round runs one variant, analyzes train/post metrics, mutates params, then
runs the next round. Goal: expand trade samples while reducing early losers.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-adaptive10.md
  .Codex/reports/2026-05-27_w4-v3fin-adaptive10-trades.csv
"""
import os

os.environ.setdefault("MP_BACKTEST_CPU_LIMIT", "0.4")
os.environ.setdefault("W4_PRE_START", "2012-01-01")

from copy import deepcopy

import pandas as pd

import backtest_v3fin_portfolio_sample_expansion as sim


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-adaptive10.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-adaptive10-trades.csv"

BASE_PARAMS = {
    "delay": 5,
    "entry_loc": 0.55,
    "entry_ma20_min": 0.02,
    "entry_next_body_min": 0.00,
    "top_n": 50,
}


def pct(v):
    return "-" if v is None or pd.isna(v) else f"{v * 100:.2f}%"


def metric_or_empty(trades, period):
    for name, start, end in sim.PERIODS:
        if name == period:
            return sim.metric(trades, start, end)
    return None


def score_metrics(pre, train, post):
    if not train:
        return -9999.0
    score = train["n"] + (post["n"] if post else 0) + 0.1 * (pre["n"] if pre else 0)
    score += train["avg"] * 100
    score += (post["avg"] * 40 if post else 0)
    score += train["win"] * 8
    score -= abs(min(0, train["worst"])) * 120
    if train["early"] / max(train["n"], 1) > 0.25:
        score -= 8
    if post and post["avg"] < 0:
        score -= 20
    return score


def describe_metrics(m):
    if not m:
        return "no trades"
    early_rate = m["early"] / max(m["n"], 1)
    stop_rate = m["stop"] / max(m["n"], 1)
    return (
        f"N={m['n']}, avg={pct(m['avg'])}, worst={pct(m['worst'])}, "
        f"win={pct(m['win'])}, early={m['early']}({pct(early_rate)}), "
        f"stop={m['stop']}({pct(stop_rate)})"
    )


def train_feature_notes(trades):
    train = trades[trades["period"] == "train"].copy()
    if len(train) < 10:
        return {}
    winners = train[train["ret"] > 0]
    losers = train[train["ret"] <= 0]
    early = train[train["reason"].str.contains("EARLY_FAIL", na=False)]
    notes = {}
    for col in ["sig_range20", "sig_ret60", "entry_vol_exp", "entry_ma20_dist", "next_body_ret"]:
        if col not in train.columns:
            continue
        notes[col] = {
            "win_med": winners[col].median() if len(winners) else None,
            "lose_med": losers[col].median() if len(losers) else None,
            "early_med": early[col].median() if len(early) else None,
        }
    return notes


def set_param(params, key, value):
    out = deepcopy(params)
    if value is None:
        out.pop(key, None)
    else:
        out[key] = value
    return out


def next_params(last_params, train, post, notes, seen):
    params = deepcopy(last_params)
    reason = []
    early_rate = train["early"] / max(train["n"], 1) if train else 1.0
    win = train["win"] if train else 0.0
    worst = train["worst"] if train else -1.0
    n = train["n"] if train else 0

    candidates = []

    if n < 30:
        p = deepcopy(params)
        p["top_n"] = min(80, int(p.get("top_n", 50)) + 10)
        p["entry_loc"] = max(0.50, float(p.get("entry_loc", 0.55)) - 0.03)
        p["entry_ma20_min"] = max(0.00, float(p.get("entry_ma20_min", 0.02)) - 0.01)
        candidates.append(("sample too small -> loosen entry/top_n", p))

    if early_rate > 0.22:
        if "vol_exp_min" not in params:
            candidates.append(("early high -> require vol_exp >= 0.70", set_param(params, "vol_exp_min", 0.70)))
        if "range20_max" not in params:
            candidates.append(("early high -> require range20 <= 0.45", set_param(params, "range20_max", 0.45)))
        if "ma60_dist_max" not in params:
            candidates.append(("early high -> require ma60_dist <= 0.55", set_param(params, "ma60_dist_max", 0.55)))

    if worst < -0.02:
        if float(params.get("entry_loc", 0.55)) < 0.65:
            p = set_param(params, "entry_loc", round(float(params.get("entry_loc", 0.55)) + 0.05, 2))
            candidates.append(("worst month weak -> stronger entry candle loc", p))
        if "entry_next_body_min" not in params or float(params.get("entry_next_body_min", 0)) < 0.01:
            candidates.append(("worst month weak -> require next body >= 1%", set_param(params, "entry_next_body_min", 0.01)))

    if win < 0.40 and n >= 30:
        if "ret60_min" not in params:
            candidates.append(("win weak -> require ret60 >= 0.40", set_param(params, "ret60_min", 0.40)))
        elif float(params.get("ret60_min", 0)) < 0.60:
            candidates.append(("win weak -> raise ret60 >= 0.60", set_param(params, "ret60_min", 0.60)))

    if post and post["n"] < 15:
        p = deepcopy(params)
        p.pop("ma60_dist_max", None)
        p["top_n"] = min(80, int(p.get("top_n", 50)) + 10)
        candidates.append(("post sample small -> loosen distance/top_n", p))

    if not candidates:
        p = deepcopy(params)
        p["top_n"] = min(80, int(p.get("top_n", 50)) + 10)
        candidates.append(("metrics tolerable -> expand sample", p))

    for why, cand in candidates:
        sig = tuple(sorted(cand.items()))
        if sig not in seen:
            reason.append(why)
            return cand, "; ".join(reason)

    # Deterministic fallback: alternate one new mild filter.
    fallback_keys = [
        ("vol_exp_min", 1.00, "fallback -> raise volume quality"),
        ("range20_max", 0.50, "fallback -> mild range cap"),
        ("ret60_min", 0.30, "fallback -> mild momentum floor"),
        ("ma60_dist_max", 0.70, "fallback -> mild extension cap"),
    ]
    for key, value, why in fallback_keys:
        cand = set_param(params, key, value)
        sig = tuple(sorted(cand.items()))
        if sig not in seen:
            return cand, why
    return params, "no unseen mutation left -> repeat best-known params"


def format_params(params):
    keys = sorted(params)
    return ", ".join(f"{k}={params[k]}" for k in keys)


def main():
    frames = []
    summaries = []
    seen = set()
    params = deepcopy(BASE_PARAMS)

    for i in range(1, 11):
        label = f"adaptive{i:02d}"
        seen.add(tuple(sorted(params.items())))
        print(f"running {label}: {format_params(params)}")
        trades = sim.run_variant(label, params)
        frames.append(trades)
        pre = metric_or_empty(trades, "pre")
        train = metric_or_empty(trades, "train")
        post = metric_or_empty(trades, "post")
        notes = train_feature_notes(trades)
        score = score_metrics(pre, train, post)
        next_p, decision = next_params(params, train, post, notes, seen) if i < 10 else (None, "final iteration")
        summaries.append(
            {
                "label": label,
                "params": deepcopy(params),
                "pre": pre,
                "train": train,
                "post": post,
                "score": score,
                "decision": decision,
                "notes": notes,
                "next_params": deepcopy(next_p) if next_p else None,
            }
        )
        if next_p is not None:
            params = next_p

    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    ranked = sorted(summaries, key=lambda x: x["score"], reverse=True)
    lines = [
        "# W4 V3-FIN Adaptive 10-Iteration Report\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {sim.CAPITAL:,}\n",
        f"position_cash: {sim.POSITION_CASH:,}\n",
        f"cpu_limit: {os.getenv('MP_BACKTEST_CPU_LIMIT', '0.4')}\n",
        "mode: test -> analyze -> mutate params -> retest, sequential only\n\n",
        "## Ranking\n\n",
        "| rank | iteration | score | train N | train avg | train worst | train win | train early | post N | post avg | post win |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for rank, item in enumerate(ranked, 1):
        train = item["train"]
        post = item["post"]
        train_early = train["early"] / max(train["n"], 1) if train else None
        lines.append(
            f"| {rank} | {item['label']} | {item['score']:.2f} | {train['n'] if train else 0} | "
            f"{pct(train['avg'] if train else None)} | {pct(train['worst'] if train else None)} | "
            f"{pct(train['win'] if train else None)} | {pct(train_early)} | {post['n'] if post else 0} | "
            f"{pct(post['avg'] if post else None)} | {pct(post['win'] if post else None)} |\n"
        )

    lines.extend(
        [
            "\n## Iteration Log\n\n",
            "| iteration | params | train | post | analysis -> next change |\n",
            "|---|---|---|---|---|\n",
        ]
    )
    for item in summaries:
        lines.append(
            f"| {item['label']} | `{format_params(item['params'])}` | "
            f"{describe_metrics(item['train'])} | {describe_metrics(item['post'])} | "
            f"{item['decision']} |\n"
        )

    lines.extend(["\n## Readout\n\n"])
    best = ranked[0]
    lines.append(f"- Best adaptive candidate: `{best['label']}` with `{format_params(best['params'])}`.\n")
    lines.append(
        "- Loop optimized sample quality, not final profit. Score rewards train/post sample, positive avg, win rate, and lower drawdown/early-fail.\n"
    )
    lines.append(
        "- If best still has high early fail, next work should scan entry-day features around early-fail trades before tightening more filters.\n"
    )
    lines.append(f"- Trades: `{OUT_CSV}`\n")

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
