"""Exit grid for V3-FIN-NB-BOTH-MA20-RISK-NEXTBODY1.

Goal:
  Push train average monthly toward 40-50% by improving exits while keeping
  worst month controlled.

Writes:
  .Codex/reports/2026-05-26_w4-v3fin-exit-grid.md
  .Codex/reports/2026-05-26_w4-v3fin-exit-grid-trades.csv
"""
import pandas as pd

import backtest_v3fin_early_fail as base


g_all = base.df.groupby("asset_code", group_keys=False)
base.df["ma5"] = g_all["close_price"].transform(lambda x: x.rolling(5, min_periods=5).mean())
base.df["ma10"] = g_all["close_price"].transform(lambda x: x.rolling(10, min_periods=10).mean())
local_stocks = base.df[base.df["asset_type"] == "STOCK"].copy()
local_indexed = local_stocks.set_index(["asset_code", "trade_date"])


COMMON_ENTRY = {
    "delay": 5,
    "top_n": 10,
    "entry_drawdown": -0.05,
    "entry_loc": 0.65,
    "entry_shadow": 0.08,
    "entry_body": 0.0,
    "entry_ma20_min": 0.05,
    "entry_next_body_min": 0.01,
    "cadence_days": 5,
    "regime": "both_ma20",
}


EXIT_VARIANTS = [
    ("base_mh30_t20_20", {"mh": 30, "ts": 0.20, "tp": 0.20}),
    ("mh45_t20_20", {"mh": 45, "ts": 0.20, "tp": 0.20}),
    ("mh60_t20_20", {"mh": 60, "ts": 0.20, "tp": 0.20}),
    ("mh45_t30_20", {"mh": 45, "ts": 0.30, "tp": 0.20}),
    ("mh60_t30_20", {"mh": 60, "ts": 0.30, "tp": 0.20}),
    ("mh60_t40_25", {"mh": 60, "ts": 0.40, "tp": 0.25}),
    ("mh45_ma5trail", {"mh": 45, "ts": 0.20, "tp": None, "ma_trail": "ma5"}),
    ("mh60_ma5trail", {"mh": 60, "ts": 0.20, "tp": None, "ma_trail": "ma5"}),
    ("mh60_ma10trail", {"mh": 60, "ts": 0.20, "tp": None, "ma_trail": "ma10"}),
    ("grace_mh30_t20_20", {"mh": 30, "ts": 0.20, "tp": 0.20, "ef_grace": True}),
    ("grace_mh45_t20_20", {"mh": 45, "ts": 0.20, "tp": 0.20, "ef_grace": True}),
    ("grace_mh60_t20_20", {"mh": 60, "ts": 0.20, "tp": 0.20, "ef_grace": True}),
    ("grace_mh60_t30_20", {"mh": 60, "ts": 0.30, "tp": 0.20, "ef_grace": True}),
    ("grace_mh60_t40_25", {"mh": 60, "ts": 0.40, "tp": 0.25, "ef_grace": True}),
    ("grace_mh60_ma10trail", {"mh": 60, "ts": 0.20, "tp": None, "ma_trail": "ma10", "ef_grace": True}),
    ("cond_ext60_ret15_ma10", {"mh": 60, "base_mh": 30, "extend_ret": 0.15, "extend_ma": "ma20", "extension_trail": "ma10"}),
    ("cond_ext60_ret25_ma10", {"mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20", "extension_trail": "ma10"}),
    ("cond_ext60_ret15_t20", {"mh": 60, "base_mh": 30, "extend_ret": 0.15, "extend_ma": "ma20", "extension_tp": 0.20}),
    ("cond_ext60_ret25_t20", {"mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20", "extension_tp": 0.20}),
]


PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train_to_2025_06", base.TRAIN_START, "2025-06-30"),
    ("train_to_2025_07", base.TRAIN_START, "2025-07-31"),
    ("post_from_2025_07", "2025-07-01", base.POST_END),
    ("post_from_2025_08", base.POST_START, base.POST_END),
]


def get_future_rows(code, start, n):
    future = [d for d in base.asset_dates.get(code, []) if d >= pd.Timestamp(start)][: n + 1]
    rows = []
    for d in future:
        try:
            r = local_indexed.loc[(code, d)]
        except KeyError:
            continue
        rows.append(
            {
                "trade_date": d,
                "open": float(r["open_price"]),
                "high": float(r["high_price"]),
                "low": float(r["low_price"]),
                "close": float(r["close_price"]),
                "ma5": float(r["ma5"]) if pd.notna(r["ma5"]) else None,
                "ma10": float(r["ma10"]) if pd.notna(r["ma10"]) else None,
                "ma20": float(r["ma20"]) if pd.notna(r["ma20"]) else None,
                "volume": float(r["volume"]),
                "avg_vol20": float(r["avg_vol20"]) if pd.notna(r["avg_vol20"]) else None,
            }
        )
    return pd.DataFrame(rows) if rows else None


def should_grace(row, entry):
    ma20 = row.get("ma20")
    avg_vol20 = row.get("avg_vol20")
    if ma20 is None or avg_vol20 is None:
        return False
    close = float(row["close"])
    volume = float(row["volume"])
    return close > ma20 and close >= entry * 0.96 and volume >= avg_vol20 * 0.7


def simulate_exit(prices, stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20, mh=30,
                  ma_trail=None, ef_grace=False, base_mh=None, extend_ret=None,
                  extend_ma=None, extension_trail=None, extension_tp=None):
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry = float(prices.iloc[0]["open"])
    peak = entry
    grace_used = False
    extended = base_mh is None
    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo = float(row["low"])
        hi = float(row["high"])
        close = float(row["close"])
        low_ret = (lo - entry) / entry

        if i < efd and low_ret <= ef:
            if ef_grace and not grace_used and should_grace(row, entry):
                grace_used = True
            else:
                return row["trade_date"], ef - base.COST, "EARLY_FAIL_GRACE_USED" if grace_used else "EARLY_FAIL"

        if low_ret <= stop:
            return row["trade_date"], stop - base.COST, "STOP"

        peak = max(peak, hi)
        peak_ret = (peak - entry) / entry
        if peak_ret >= ts:
            if ma_trail:
                ma = row.get(ma_trail)
                if ma is not None and close < ma:
                    return row["trade_date"], (close - entry) / entry - base.COST, f"{ma_trail.upper()}_TRAIL"
            elif tp is not None and (close - peak) / peak <= -tp:
                return row["trade_date"], (close - entry) / entry - base.COST, "TRAIL"

        if base_mh is not None and i >= base_mh - 1 and not extended:
            ma_ok = True
            if extend_ma:
                ma = row.get(extend_ma)
                ma_ok = ma is not None and close > ma
            ret_ok = (close - entry) / entry >= (extend_ret or 0)
            if ma_ok and ret_ok:
                extended = True
                peak = max(peak, hi)
                continue
            return row["trade_date"], (close - entry) / entry - base.COST, "MAX"

        if extended and extension_trail:
            ma = row.get(extension_trail)
            if ma is not None and close < ma:
                return row["trade_date"], (close - entry) / entry - base.COST, f"EXT_{extension_trail.upper()}_TRAIL"

        if extended and extension_tp is not None and (close - peak) / peak <= -extension_tp:
            return row["trade_date"], (close - entry) / entry - base.COST, "EXT_TRAIL"

        if i >= mh - 1:
            return row["trade_date"], (close - entry) / entry - base.COST, "MAX"

    last = prices.iloc[-1]
    return last["trade_date"], (float(last["close"]) - entry) / entry - base.COST, "MAX"


def run_bt(label, exit_params):
    sig_dates = sorted(base.candidates["trade_date"].unique())
    cadence = []
    prev = None
    for d in sig_dates:
        idx = base.date_to_idx.get(d)
        if idx is None:
            continue
        if prev is None or idx - prev >= COMMON_ENTRY["cadence_days"]:
            cadence.append(d)
            prev = idx

    trades = []
    month_pnl = {}
    open_until = None
    for sd in cadence:
        sp = pd.Timestamp(sd)
        ym = (sp.year, sp.month)
        if month_pnl.get(ym, 0) <= -0.15:
            continue
        if open_until is not None and sp <= open_until:
            continue
        if not base.pass_regime(sp, COMMON_ENTRY["regime"]):
            continue

        day_candidates = base.candidates[base.candidates["trade_date"] == sp].sort_values("score", ascending=False).head(COMMON_ENTRY["top_n"])
        selected = None
        for _, cand in day_candidates.iterrows():
            code = cand["asset_code"]
            entry_check_day = base.get_nth_day(code, sp, COMMON_ENTRY["delay"])
            if entry_check_day is None:
                continue
            try:
                er = base.df_indexed.loc[(code, entry_check_day)]
            except KeyError:
                continue
            if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < COMMON_ENTRY["entry_drawdown"]:
                continue
            if float(er["candle_loc"]) < COMMON_ENTRY["entry_loc"]:
                continue
            if float(er["upper_shadow"]) > COMMON_ENTRY["entry_shadow"]:
                continue
            if float(er["body_ret"]) < COMMON_ENTRY["entry_body"]:
                continue
            ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
            if ma20_dist < COMMON_ENTRY["entry_ma20_min"]:
                continue
            next_day = base.get_nth_day(code, entry_check_day, 1)
            if next_day is None:
                continue
            try:
                nr = base.df_indexed.loc[(code, next_day)]
                if float(nr["body_ret"]) < COMMON_ENTRY["entry_next_body_min"]:
                    continue
            except KeyError:
                continue
            selected = (cand, entry_check_day, next_day)
            break
        if selected is None:
            continue

        cand, entry_check_day, execution_day = selected
        future = get_future_rows(cand["asset_code"], execution_day, exit_params.get("mh", 30) + 1)
        exit_day, ret, reason = simulate_exit(future, **exit_params)
        if exit_day is None:
            continue
        exit_month = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_month] = month_pnl.get(exit_month, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = "pre" if sp <= pd.Timestamp(base.PRE_END) else ("train" if sp <= pd.Timestamp(base.TRAIN_END) else "post")
        trades.append(
            {
                "variant": label,
                "period": period,
                "signal_date": sd,
                "asset_code": cand["asset_code"],
                "asset_name": cand["asset_name"],
                "entry_check_date": entry_check_day,
                "entry_date": execution_day,
                "exit_date": exit_day,
                "ret": ret,
                "reason": reason,
                "sig_range20": cand["range20"],
                "sig_ret60": cand["ret60"],
            }
        )
    return pd.DataFrame(trades)


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
        "early": int(s["reason"].str.contains("EARLY_FAIL").sum()),
        "stop": int((s["reason"] == "STOP").sum()),
    }


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    rows = []
    ranks = []
    frames = []
    for label, exit_params in EXIT_VARIANTS:
        trades = run_bt(label, {"stop": -0.12, "ef": -0.06, "efd": 3, **exit_params})
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
            pass_core = pre["avg"] > 0 and train["avg"] >= 0.40 and train["worst"] >= -0.13 and train["win"] >= 0.70
            score = train["avg"] + train["win"] * 0.20 + min(pre["avg"], 0.20) + train["worst"]
            if post and post["avg"] < 0:
                score -= 0.05
            ranks.append([label, pass_core, score, pre, train, post])

    trades_path = ".Codex/reports/2026-05-26_w4-v3fin-exit-grid-trades.csv"
    pd.concat(frames, ignore_index=True).to_csv(trades_path, index=False, encoding="utf-8-sig")
    ranks.sort(key=lambda x: (x[1], x[2]), reverse=True)

    lines = [
        "# W4 V3-FIN Exit Grid\n\n",
        "date: 2026-05-26\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass40 | score | pre avg | train avg | train worst | train win | post avg | N train |\n",
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
        "- Goal: test whether exit logic alone can lift train average monthly toward 40-50%.\n",
        "- Guardrails: train avg >=40% first, worst >=-13%, win >=70%, pre positive.\n",
        "- Early-fail grace means first -6% low touch is ignored once if close remains above MA20 with acceptable volume.\n",
        f"- Trades: `{trades_path}`\n",
    ])

    report_path = ".Codex/reports/2026-05-26_w4-v3fin-exit-grid.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {report_path}")


if __name__ == "__main__":
    main()
