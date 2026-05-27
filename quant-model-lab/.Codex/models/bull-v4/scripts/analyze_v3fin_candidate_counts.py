"""Daily candidate count diagnostic for W4/V3-FIN.

Goal:
  Separate "rare signal" from "single-slot portfolio" bottleneck.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-candidate-counts.md
  .Codex/reports/2026-05-27_w4-v3fin-candidate-counts.csv
"""
import os

os.environ.setdefault("W4_PRE_START", "2012-01-01")

import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority
import pandas as pd

import backtest_v3fin_early_fail as base


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-candidate-counts.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-candidate-counts.csv"

PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post", base.POST_START, base.POST_END),
]

ENTRY = {
    "delay": 5,
    "entry_drawdown": -0.05,
    "entry_loc": 0.65,
    "entry_shadow": 0.08,
    "entry_body": 0.0,
    "entry_ma20_min": 0.05,
    "entry_next_body_min": 0.01,
}

ASSET_DATE_POS = {
    code: {pd.Timestamp(d): i for i, d in enumerate(dates)}
    for code, dates in base.asset_dates.items()
}


def nth_day_fast(code, sig, n):
    dates = base.asset_dates.get(code)
    pos_map = ASSET_DATE_POS.get(code)
    if not dates or not pos_map:
        return None
    idx = pos_map.get(pd.Timestamp(sig))
    if idx is None:
        return None
    target = idx + n
    return dates[target] if target < len(dates) else None


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


def entry_pass(cand):
    code = cand["asset_code"]
    sp = pd.Timestamp(cand["trade_date"])
    entry_check_day = nth_day_fast(code, sp, ENTRY["delay"])
    if entry_check_day is None:
        return False
    try:
        er = base.df_indexed.loc[(code, entry_check_day)]
    except KeyError:
        return False
    if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < ENTRY["entry_drawdown"]:
        return False
    if float(er["candle_loc"]) < ENTRY["entry_loc"]:
        return False
    if float(er["upper_shadow"]) > ENTRY["entry_shadow"]:
        return False
    if float(er["body_ret"]) < ENTRY["entry_body"]:
        return False
    ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
    if ma20_dist < ENTRY["entry_ma20_min"]:
        return False
    next_day = nth_day_fast(code, entry_check_day, 1)
    if next_day is None:
        return False
    try:
        nr = base.df_indexed.loc[(code, next_day)]
    except KeyError:
        return False
    return float(nr["body_ret"]) >= ENTRY["entry_next_body_min"]


def build_daily_counts():
    kospi_dates = (
        base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == "KOSPI")]["trade_date"]
        .drop_duplicates()
        .sort_values()
    )
    cands_by_date = {
        d: group.sort_values("score", ascending=False)
        for d, group in base.candidates.groupby("trade_date")
    }
    rows = []
    for d in kospi_dates:
        if d < pd.Timestamp(base.PRE_START) or d > pd.Timestamp(base.POST_END):
            continue
        raw = cands_by_date.get(d, pd.DataFrame())
        regime = regime_for(d)
        market_gate = bool(base.pass_regime(pd.Timestamp(d), "both_ma20"))
        raw_count = len(raw)
        top10 = raw.head(10)
        top20 = raw.head(20)
        pass20 = [entry_pass(cand) for _, cand in top20.iterrows()] if raw_count else []
        entry_top10 = sum(pass20[:10])
        entry_top20 = sum(pass20)
        rows.append(
            {
                "trade_date": d,
                "period": period_for(d),
                "regime": regime,
                "market_gate": market_gate,
                "raw_candidates": raw_count,
                "entry_pass_top10": entry_top10,
                "entry_pass_top20": entry_top20,
            }
        )
    return pd.DataFrame(rows)


def period_for(date):
    d = pd.Timestamp(date)
    if d <= pd.Timestamp(base.PRE_END):
        return "pre"
    if d <= pd.Timestamp(base.TRAIN_END):
        return "train"
    return "post"


def summarize(df, group_cols, count_col):
    rows = []
    for keys, s in df.groupby(group_cols):
        if not isinstance(keys, tuple):
            keys = (keys,)
        rows.append(
            {
                **dict(zip(group_cols, keys)),
                "days": len(s),
                "avg": s[count_col].mean(),
                "median": s[count_col].median(),
                "max": s[count_col].max(),
                "days_ge1": (s[count_col] >= 1).mean(),
                "days_ge2": (s[count_col] >= 2).mean(),
                "days_ge5": (s[count_col] >= 5).mean(),
            }
        )
    return pd.DataFrame(rows)


def pct(v):
    return f"{v * 100:.1f}%"


def table(lines, title, summary, label_cols):
    lines.extend([
        f"\n## {title}\n\n",
        "| " + " | ".join(label_cols + ["days", "avg", "median", "max", ">=1", ">=2", ">=5"]) + " |\n",
        "| " + " | ".join(["---"] * (len(label_cols) + 7)) + " |\n",
    ])
    for _, r in summary.iterrows():
        labels = [str(r[c]) for c in label_cols]
        lines.append(
            "| "
            + " | ".join(
                labels
                + [
                    str(int(r["days"])),
                    f"{r['avg']:.2f}",
                    f"{r['median']:.2f}",
                    str(int(r["max"])),
                    pct(r["days_ge1"]),
                    pct(r["days_ge2"]),
                    pct(r["days_ge5"]),
                ]
            )
            + " |\n"
        )


def main():
    df = build_daily_counts()
    df.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    raw_period = summarize(df, ["period"], "raw_candidates")
    raw_regime = summarize(df, ["period", "regime"], "raw_candidates")
    entry_period = summarize(df, ["period"], "entry_pass_top10")
    entry_regime = summarize(df, ["period", "regime"], "entry_pass_top10")
    entry20_period = summarize(df, ["period"], "entry_pass_top20")

    lines = [
        "# W4 V3-FIN Candidate Counts\n\n",
        f"date: {REPORT_DATE}\n",
        f"range: {base.PRE_START}~{base.POST_END}\n\n",
        "## Method\n\n",
        "- `raw_candidates`: W4 signal candidates before entry confirmation.\n",
        "- `entry_pass_top10`: candidates in top 10 that pass delay/entry/next-body confirmation.\n",
        "- Counts are per trading day; portfolio single-slot/open-position lock is not applied.\n",
        "- This diagnoses whether low trade count comes from rare candidates or portfolio slot constraints.\n",
    ]
    table(lines, "Raw Candidates By Period", raw_period, ["period"])
    table(lines, "Raw Candidates By Regime", raw_regime, ["period", "regime"])
    table(lines, "Entry-Pass Top10 By Period", entry_period, ["period"])
    table(lines, "Entry-Pass Top10 By Regime", entry_regime, ["period", "regime"])
    table(lines, "Entry-Pass Top20 By Period", entry20_period, ["period"])
    lines.extend(
        [
            "\n## Readout\n\n",
            "- If raw candidates are frequent but entry-pass is sparse, entry confirmation is bottleneck.\n",
            "- If entry-pass has >=1/2 often but trades are few, single-slot `open_until` is bottleneck.\n",
            "- Next grid should test portfolio slots only after this count profile is reviewed.\n",
            f"- Daily counts: `{OUT_CSV}`\n",
        ]
    )
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
