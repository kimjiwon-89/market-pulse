"""Portfolio sample expansion for W4/V3-FIN.

Purpose:
  Increase trade count for chart/timing analysis, not immediate return optimization.

Rules:
  - 1B KRW capital, 100M KRW per position
  - Up to 10 open positions
  - Up to 5 buys per signal day
  - Relaxed entry grid
  - Current best exit: close-confirm early fail + conditional 60d extension

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-portfolio-sample-expansion.md
  .Codex/reports/2026-05-27_w4-v3fin-portfolio-sample-expansion-trades.csv
"""
import os

os.environ.setdefault("W4_PRE_START", "2012-01-01")

import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority
import pandas as pd

import backtest_v3fin_post_exit_grid as post_grid


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-portfolio-sample-expansion.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-portfolio-sample-expansion-trades.csv"

base = post_grid.prev.base

CAPITAL = 1_000_000_000
POSITION_CASH = 100_000_000
MAX_POSITIONS = 10
MAX_BUYS_PER_DAY = 5
LIQUIDITY_CAP = 0.03

PERIODS = [
    ("pre", base.PRE_START, base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post", base.POST_START, base.POST_END),
]

ENTRY_VARIANTS = [
    ("relaxed_d5_loc55_ma2_nb0_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50}),
    ("relaxed_ret60_40_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.40}),
    ("relaxed_vol07_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "vol_exp_min": 0.70}),
    ("relaxed_vol10_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "vol_exp_min": 1.00}),
    ("relaxed_range45_ma60dist40_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "range20_max": 0.45, "ma60_dist_max": 0.40}),
    ("relaxed_rank20_range45_ma60dist40_vol07", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 20, "range20_max": 0.45, "ma60_dist_max": 0.40, "vol_exp_min": 0.70}),
    ("relaxed_ret60_40_vol07_top50", {"delay": 5, "entry_loc": 0.55, "entry_ma20_min": 0.02, "entry_next_body_min": 0.00, "top_n": 50, "ret60_min": 0.40, "vol_exp_min": 0.70}),
    ("current_entry_top20", {"delay": 5, "entry_loc": 0.65, "entry_ma20_min": 0.05, "entry_next_body_min": 0.01, "top_n": 20}),
]

EXIT_PARAMS = {"stop": -0.12, "ef": -0.06, "efd": 3, **post_grid.EXIT_VARIANTS[1][1]}


def get_nth_day_fast_maps():
    return {
        code: {pd.Timestamp(d): i for i, d in enumerate(dates)}
        for code, dates in base.asset_dates.items()
    }


DATE_POS = get_nth_day_fast_maps()
FUTURE_CACHE = {}
ASSET_FRAMES = {
    code: group.sort_values("trade_date").reset_index(drop=True)
    for code, group in base.df[base.df["asset_type"] == "STOCK"].groupby("asset_code")
}
FRAME_DATE_POS = {
    code: {pd.Timestamp(d): i for i, d in enumerate(frame["trade_date"])}
    for code, frame in ASSET_FRAMES.items()
}


def nth_day(code, date, n):
    dates = base.asset_dates.get(code)
    pos = DATE_POS.get(code, {}).get(pd.Timestamp(date))
    if dates is None or pos is None:
        return None
    idx = pos + n
    return dates[idx] if idx < len(dates) else None


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


def future_return_features(code, entry_date, entry_price):
    rows = future_rows(code, entry_date, 61)
    out = {}
    if rows is None or len(rows) == 0:
        return out
    for n in [5, 10, 20, 60]:
        if len(rows) > n:
            r = rows.iloc[n]
            out[f"close_{n}d"] = (float(r["close"]) - entry_price) / entry_price
            out[f"max_{n}d"] = (rows.iloc[: n + 1]["high"].max() - entry_price) / entry_price
            out[f"min_{n}d"] = (rows.iloc[: n + 1]["low"].min() - entry_price) / entry_price
    return out


def future_rows(code, entry_date, n):
    key = (code, pd.Timestamp(entry_date), n)
    if key not in FUTURE_CACHE:
        frame = ASSET_FRAMES.get(code)
        pos = FRAME_DATE_POS.get(code, {}).get(pd.Timestamp(entry_date))
        if frame is None or pos is None:
            FUTURE_CACHE[key] = None
        else:
            chunk = frame.iloc[pos : pos + n + 1]
            if len(chunk) == 0:
                FUTURE_CACHE[key] = None
            else:
                FUTURE_CACHE[key] = pd.DataFrame(
                    {
                        "trade_date": chunk["trade_date"].values,
                        "open": chunk["open_price"].astype(float).values,
                        "high": chunk["high_price"].astype(float).values,
                        "low": chunk["low_price"].astype(float).values,
                        "close": chunk["close_price"].astype(float).values,
                        "ma20": chunk["ma20"].astype(float).values,
                    }
                )
    return FUTURE_CACHE[key]


def candidate_entry(cand, params):
    code = cand["asset_code"]
    sp = pd.Timestamp(cand["trade_date"])
    entry_check_day = nth_day(code, sp, params["delay"])
    if entry_check_day is None:
        return None
    try:
        er = base.df_indexed.loc[(code, entry_check_day)]
    except KeyError:
        return None

    if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < -0.05:
        return None
    if float(er["candle_loc"]) < params["entry_loc"]:
        return None
    if float(er["upper_shadow"]) > 0.08:
        return None
    if float(er["body_ret"]) < 0.0:
        return None
    ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
    if ma20_dist < params["entry_ma20_min"]:
        return None
    next_day = nth_day(code, entry_check_day, 1)
    if next_day is None:
        return None
    try:
        nr = base.df_indexed.loc[(code, next_day)]
    except KeyError:
        return None
    if float(nr["body_ret"]) < params["entry_next_body_min"]:
        return None

    trade_amount = float(er["close_price"]) * float(er["volume"])
    if POSITION_CASH > trade_amount * LIQUIDITY_CAP:
        return None

    return {
        "entry_check_date": entry_check_day,
        "entry_date": next_day,
        "entry_candle_loc": float(er["candle_loc"]),
        "entry_upper_shadow": float(er["upper_shadow"]),
        "entry_body_ret": float(er["body_ret"]),
        "entry_ma20_dist": ma20_dist,
        "entry_vol_exp": float(er["vol_exp"]),
        "entry_trade_amount": trade_amount,
        "next_body_ret": float(nr["body_ret"]),
    }


def run_variant(label, params):
    sig_dates = sorted(base.candidates["trade_date"].unique())
    trades = []
    open_positions = []

    for sd in sig_dates:
        sp = pd.Timestamp(sd)
        open_positions = [p for p in open_positions if p > sp]
        if not base.pass_regime(sp, "both_ma20"):
            continue

        slots = MAX_POSITIONS - len(open_positions)
        if slots <= 0:
            continue
        max_buys = min(slots, MAX_BUYS_PER_DAY)
        day_cands = (
            base.candidates[base.candidates["trade_date"] == sp]
            .sort_values("score", ascending=False)
            .head(params["top_n"])
        )
        bought = 0
        for _, cand in day_cands.iterrows():
            if bought >= max_buys:
                break
            if "ret60_min" in params and float(cand["ret60"]) < params["ret60_min"]:
                continue
            if "ret60_max" in params and float(cand["ret60"]) > params["ret60_max"]:
                continue
            if "vol_exp_min" in params and float(cand["vol_exp"]) < params["vol_exp_min"]:
                continue
            if "range20_max" in params and float(cand["range20"]) > params["range20_max"]:
                continue
            if "ma60_dist_max" in params and float(cand["ma60_dist"]) > params["ma60_dist_max"]:
                continue
            entry = candidate_entry(cand, params)
            if entry is None:
                continue
            rows = future_rows(cand["asset_code"], entry["entry_date"], EXIT_PARAMS.get("mh", 60) + 1)
            exit_day, raw_ret, reason = post_grid.simulate_exit(rows, **EXIT_PARAMS)
            if exit_day is None:
                continue
            try:
                entry_row = rows.iloc[0]
                entry_price = float(entry_row["open"])
            except Exception:
                continue
            fwd = future_return_features(cand["asset_code"], entry["entry_date"], entry_price)
            period = period_for(sp)
            regime = regime_for(sp)
            position_ret = raw_ret
            trades.append(
                {
                    "variant": label,
                    "period": period,
                    "regime": regime,
                    "signal_date": sd,
                    "asset_code": cand["asset_code"],
                    "asset_name": cand["asset_name"],
                    "entry_check_date": entry["entry_check_date"],
                    "entry_date": entry["entry_date"],
                    "exit_date": exit_day,
                    "ret": position_ret,
                    "pnl_krw": position_ret * POSITION_CASH,
                    "reason": reason,
                    "sig_range20": cand["range20"],
                    "sig_ret60": cand["ret60"],
                    **entry,
                    **fwd,
                }
            )
            open_positions.append(pd.Timestamp(exit_day))
            bought += 1
    return pd.DataFrame(trades)


def metric(trades, start, end):
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start))
        & (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ].copy()
    if len(s) == 0:
        return None
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly_pnl = s.groupby("ym")["pnl_krw"].sum() / CAPITAL
    return {
        "avg": monthly_pnl.mean(),
        "total": s["pnl_krw"].sum() / CAPITAL,
        "worst": monthly_pnl.min(),
        "n": len(s),
        "win": (s["ret"] > 0).mean(),
        "early": int(s["reason"].str.contains("EARLY_FAIL").sum()),
        "stop": int((s["reason"] == "STOP").sum()),
    }


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    frames = [run_variant(label, params) for label, params in ENTRY_VARIANTS]
    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    rows = []
    ranks = []
    for label in all_trades["variant"].unique():
        vt = all_trades[all_trades["variant"] == label]
        metrics = {}
        for period, start, end in PERIODS:
            m = metric(vt, start, end)
            metrics[period] = m
            if m:
                rows.append([label, period, m])
        train = metrics.get("train")
        post = metrics.get("post")
        pre = metrics.get("pre")
        if train:
            sample_score = train["n"] + (post["n"] if post else 0) + (pre["n"] if pre else 0) * 0.1
            risk_penalty = abs(min(0, train["worst"])) * 50
            ranks.append([label, sample_score - risk_penalty, pre, train, post])
    ranks.sort(key=lambda x: x[1], reverse=True)

    lines = [
        "# W4 V3-FIN Portfolio Sample Expansion\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {CAPITAL:,}\n",
        f"position_cash: {POSITION_CASH:,}\n",
        f"max_positions: {MAX_POSITIONS}\n",
        f"max_buys_per_day: {MAX_BUYS_PER_DAY}\n",
        f"liquidity_cap: {LIQUIDITY_CAP*100:.1f}% of signal-day trade amount\n\n",
        "## Ranking For Sample Expansion\n\n",
        "| rank | variant | score | pre N | train N | post N | train avg | train worst | train win | post avg |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {score:.2f} | {pre['n'] if pre else 0} | {train['n'] if train else 0} | {post['n'] if post else 0} | "
            f"{pct(train['avg'] if train else None)} | {pct(train['worst'] if train else None)} | {pct(train['win'] if train else None)} | {pct(post['avg'] if post else None)} |\n"
        )

    lines.extend([
        "\n## Full Result\n\n",
        "| variant | period | avg monthly on capital | total on capital | worst month | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for label, period, m in rows:
        lines.append(
            f"| {label} | {period} | {pct(m['avg'])} | {pct(m['total'])} | {pct(m['worst'])} | "
            f"{m['n']} | {pct(m['win'])} | {m['early']} | {m['stop']} |\n"
        )

    lines.extend([
        "\n## Readout\n\n",
        "- This is sample expansion, not return optimization.\n",
        "- Returns are normalized to 1B KRW capital with 100M KRW per position.\n",
        "- Main success metric is trade count while keeping train/post losses tolerable.\n",
        "- Trade CSV includes entry candle and future path columns for chart/timing analysis.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ])

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
