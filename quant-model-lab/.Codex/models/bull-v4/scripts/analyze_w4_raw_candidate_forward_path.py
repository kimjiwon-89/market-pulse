"""Forward-path analysis for all raw W4 candidates.

Purpose:
  Build a large chart/timing dataset from every raw W4 candidate, including
  candidates that were not traded by the portfolio simulator.

Writes:
  .Codex/reports/2026-05-27_w4-raw-candidate-forward-path.csv
  .Codex/reports/2026-05-27_w4-raw-candidate-forward-path.md
"""
import os

os.environ.setdefault("W4_PRE_START", "2012-01-01")

import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority
import pandas as pd

import backtest_v3fin_early_fail as base


REPORT_DATE = "2026-05-27"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-raw-candidate-forward-path.csv"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-raw-candidate-forward-path.md"

HORIZONS = [3, 5, 10, 20, 40, 60]
PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post", base.POST_START, base.POST_END),
]


ASSET_FRAMES = {
    code: group.sort_values("trade_date").reset_index(drop=True)
    for code, group in base.df[base.df["asset_type"] == "STOCK"].groupby("asset_code")
}
DATE_POS = {
    code: {pd.Timestamp(d): i for i, d in enumerate(frame["trade_date"])}
    for code, frame in ASSET_FRAMES.items()
}


def regime_for(date):
    d = pd.Timestamp(date)
    kospi_ma20 = base.index_regime_maps.get("KOSPI_ma20", {}).get(d, False)
    kosdaq_ma20 = base.index_regime_maps.get("KOSDAQ_ma20", {}).get(d, False)
    kospi_ma60 = base.index_regime_maps.get("KOSPI_ma60", {}).get(d, False)
    kosdaq_ma60 = base.index_regime_maps.get("KOSDAQ_ma60", {}).get(d, False)
    if kospi_ma20 and kosdaq_ma20:
        return "BULL"
    if not kospi_ma60 and not kosdaq_ma60:
        return "CRASH"
    if not kospi_ma60:
        return "BEAR"
    return "SIDEWAYS"


def period_for(date):
    d = pd.Timestamp(date)
    if d <= pd.Timestamp(base.PRE_END):
        return "pre"
    if d <= pd.Timestamp(base.TRAIN_END):
        return "train"
    return "post"


def future_slice(code, signal_date, max_horizon=60):
    frame = ASSET_FRAMES.get(code)
    pos = DATE_POS.get(code, {}).get(pd.Timestamp(signal_date))
    if frame is None or pos is None:
        return None
    return frame.iloc[pos : pos + max_horizon + 1]


def forward_features(code, signal_date, signal_close):
    rows = future_slice(code, signal_date, max(HORIZONS))
    out = {}
    if rows is None or len(rows) < 2:
        return out
    close0 = float(signal_close)
    for h in HORIZONS:
        if len(rows) > h:
            window = rows.iloc[1 : h + 1]
            close_h = float(rows.iloc[h]["close_price"])
            out[f"close_{h}d"] = close_h / close0 - 1
            out[f"max_{h}d"] = float(window["high_price"].max()) / close0 - 1
            out[f"min_{h}d"] = float(window["low_price"].min()) / close0 - 1
        else:
            out[f"close_{h}d"] = None
            out[f"max_{h}d"] = None
            out[f"min_{h}d"] = None
    return out


def build_dataset():
    rows = []
    grouped = base.candidates.sort_values(["trade_date", "score"], ascending=[True, False]).groupby("trade_date")
    for trade_date, group in grouped:
        raw_count = len(group)
        for rank, (_, cand) in enumerate(group.iterrows(), 1):
            code = cand["asset_code"]
            close = float(cand["close_price"])
            fwd = forward_features(code, trade_date, close)
            if not fwd:
                continue
            max20 = fwd.get("max_20d")
            max40 = fwd.get("max_40d")
            max60 = fwd.get("max_60d")
            min10 = fwd.get("min_10d")
            min20 = fwd.get("min_20d")
            row = {
                "period": period_for(trade_date),
                "regime": regime_for(trade_date),
                "trade_date": trade_date,
                "rank_on_day": rank,
                "raw_count_on_day": raw_count,
                "asset_code": code,
                "asset_name": cand["asset_name"],
                "close_price": close,
                "score": cand["score"],
                "range20": cand["range20"],
                "ret60": cand["ret60"],
                "ret20": cand["ret20"],
                "ma60_dist": cand["ma60_dist"],
                "candle_loc": cand["candle_loc"],
                "upper_shadow": cand["upper_shadow"],
                "body_ret": cand["body_ret"],
                "vol_exp": cand["vol_exp"],
                "trade_amount": cand["trade_amount"],
                **fwd,
            }
            row["winner_20"] = bool(max20 is not None and max20 >= 0.20)
            row["winner_50"] = bool(
                (max40 is not None and max40 >= 0.50)
                or (max60 is not None and max60 >= 0.50)
            )
            row["early_loser"] = bool(min10 is not None and min10 <= -0.10)
            row["failed_20"] = bool(
                max20 is not None
                and min20 is not None
                and max20 < 0.10
                and min20 <= -0.10
            )
            rows.append(row)
    return pd.DataFrame(rows)


def summarize(df, group_cols):
    rows = []
    for keys, s in df.groupby(group_cols):
        if not isinstance(keys, tuple):
            keys = (keys,)
        rows.append(
            {
                **dict(zip(group_cols, keys)),
                "n": len(s),
                "winner20": s["winner_20"].mean(),
                "winner50": s["winner_50"].mean(),
                "early_loser": s["early_loser"].mean(),
                "failed20": s["failed_20"].mean(),
                "avg_max20": s["max_20d"].mean(),
                "avg_max60": s["max_60d"].mean(),
                "avg_min20": s["min_20d"].mean(),
                "median_rank": s["rank_on_day"].median(),
            }
        )
    return pd.DataFrame(rows)


def pct(v):
    return "-" if pd.isna(v) else f"{v * 100:.2f}%"


def add_table(lines, title, summary, label_cols):
    lines.extend(
        [
            f"\n## {title}\n\n",
            "| " + " | ".join(label_cols + ["N", "win20", "win50", "early loser", "failed20", "avg max20", "avg max60", "avg min20", "median rank"]) + " |\n",
            "| " + " | ".join(["---"] * (len(label_cols) + 9)) + " |\n",
        ]
    )
    for _, r in summary.iterrows():
        labels = [str(r[c]) for c in label_cols]
        vals = [
            str(int(r["n"])),
            pct(r["winner20"]),
            pct(r["winner50"]),
            pct(r["early_loser"]),
            pct(r["failed20"]),
            pct(r["avg_max20"]),
            pct(r["avg_max60"]),
            pct(r["avg_min20"]),
            f"{r['median_rank']:.1f}",
        ]
        lines.append("| " + " | ".join(labels + vals) + " |\n")


def main():
    df = build_dataset()
    df.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    by_period = summarize(df, ["period"])
    by_regime = summarize(df, ["period", "regime"])
    rank_bucket = df.copy()
    rank_bucket["rank_bucket"] = pd.cut(
        rank_bucket["rank_on_day"],
        bins=[0, 5, 10, 20, 50, 10_000],
        labels=["1-5", "6-10", "11-20", "21-50", "51+"],
        include_lowest=True,
    )
    by_rank = summarize(rank_bucket, ["period", "rank_bucket"])

    lines = [
        "# W4 Raw Candidate Forward Path\n\n",
        f"date: {REPORT_DATE}\n",
        f"rows: {len(df):,}\n",
        f"range: {base.PRE_START}~{base.POST_END}\n\n",
        "## Labels\n\n",
        "- `winner_20`: max high within 20 trading days >= +20%.\n",
        "- `winner_50`: max high within 40 or 60 trading days >= +50%.\n",
        "- `early_loser`: min low within 10 trading days <= -10%.\n",
        "- `failed_20`: max20 < +10% and min20 <= -10%.\n",
    ]
    add_table(lines, "By Period", by_period, ["period"])
    add_table(lines, "By Regime", by_regime, ["period", "regime"])
    add_table(lines, "By Rank Bucket", by_rank, ["period", "rank_bucket"])
    lines.extend(
        [
            "\n## Readout\n\n",
            "- This dataset includes raw candidates whether traded or not.\n",
            "- Use it to find which ranks/features become winners before loosening live entry rules.\n",
            f"- Data: `{OUT_CSV}`\n",
        ]
    )
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
