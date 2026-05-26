"""Focused V3-FIN early-fail reduction test.

Writes:
  .Codex/reports/2026-05-26_w4-v3fin-early-fail.md
  .Codex/reports/2026-05-26_w4-v3fin-early-fail-trades.csv
"""
import warnings
import os

import pandas as pd
import psycopg2

warnings.filterwarnings("ignore")

DB = dict(host="localhost", port=5432, dbname="marketpulse", user="postgres", password="postgreskh")
PRE_START = os.getenv("W4_PRE_START", "2015-01-01")
PRE_END = os.getenv("W4_PRE_END", "2022-04-30")
TRAIN_START = os.getenv("W4_TRAIN_START", "2022-05-01")
TRAIN_END = os.getenv("W4_TRAIN_END", "2025-07-31")
POST_START = os.getenv("W4_POST_START", "2025-08-01")
POST_END = os.getenv("W4_POST_END", "2026-05-20")
COST = 0.003


def load_data():
    conn = psycopg2.connect(**DB)
    raw = pd.read_sql(
        """
        SELECT asset_code, asset_name, asset_type, trade_date,
               open_price, high_price, low_price, close_price, volume
        FROM market_daily_price
        WHERE trade_date >= %s AND trade_date <= %s
          AND close_price > 0 AND volume > 0
        ORDER BY asset_code, trade_date
        """,
        conn,
        params=[PRE_START, POST_END],
        parse_dates=["trade_date"],
    )
    conn.close()
    return raw


df = load_data().sort_values(["asset_code", "trade_date"]).reset_index(drop=True)
g = df.groupby("asset_code", group_keys=False)
df["ma20"] = g["close_price"].transform(lambda x: x.rolling(20, min_periods=20).mean())
df["ma60"] = g["close_price"].transform(lambda x: x.rolling(60, min_periods=60).mean())
df["avg_vol20"] = g["volume"].transform(lambda x: x.rolling(20, min_periods=20).mean())
df["ma20_slope5"] = g["ma20"].transform(lambda x: (x - x.shift(5)) / x.shift(5))
df["ma60_slope5"] = g["ma60"].transform(lambda x: (x - x.shift(5)) / x.shift(5))
df["ret60"] = g["close_price"].transform(lambda x: (x - x.shift(60)) / x.shift(60))
df["ret20"] = g["close_price"].transform(lambda x: (x - x.shift(20)) / x.shift(20))
df["max_high20"] = g["high_price"].transform(lambda x: x.rolling(20, min_periods=20).max())
df["min_low20"] = g["low_price"].transform(lambda x: x.rolling(20, min_periods=20).min())
df["range20"] = (df["max_high20"] - df["min_low20"]) / df["close_price"]
df["ma60_dist"] = (df["close_price"] - df["ma60"]) / df["ma60"]
hl = (df["high_price"] - df["low_price"]).clip(lower=1e-6)
df["candle_loc"] = (df["close_price"] - df["low_price"]) / hl
df["upper_shadow"] = (df["high_price"] - df[["open_price", "close_price"]].max(axis=1)) / hl
df["body_ret"] = (df["close_price"] - df["open_price"]) / df["open_price"].clip(lower=1e-6)
df["vol_exp"] = df["volume"] / df["avg_vol20"].clip(lower=1e-6)
df["trade_amount"] = df["close_price"] * df["volume"]

index_regime_maps = {}
for index_code in ["KOSPI", "KOSDAQ"]:
    index_df = df[(df["asset_type"] == "INDEX") & (df["asset_code"] == index_code)].copy().sort_values("trade_date")
    if len(index_df) == 0:
        continue
    index_df["ma20"] = index_df["close_price"].rolling(20, min_periods=20).mean()
    index_df["ma60"] = index_df["close_price"].rolling(60, min_periods=60).mean()
    index_regime_maps[f"{index_code}_ma20"] = dict(zip(index_df["trade_date"], index_df["close_price"] > index_df["ma20"]))
    index_regime_maps[f"{index_code}_ma60"] = dict(zip(index_df["trade_date"], index_df["close_price"] > index_df["ma60"]))
regime_map60 = index_regime_maps.get("KOSPI_ma60", {})

stocks = df[df["asset_type"] == "STOCK"].dropna(subset=["ma20", "ma60", "ret60", "range20", "vol_exp"])
cond_w4 = (
    (stocks["range20"] >= 0.25)
    & (stocks["range20"] <= 0.55)
    & (stocks["ret60"] >= 0.20)
    & (stocks["ma60_dist"] > 0.05)
    & (stocks["close_price"] > stocks["ma20"])
    & (stocks["close_price"] > stocks["ma60"])
    & (stocks["vol_exp"] <= 3.0)
    & (stocks["ma20_slope5"] > 0)
    & (stocks["ma60_slope5"] > 0)
    & (stocks["candle_loc"] >= 0.45)
    & (stocks["upper_shadow"] <= 0.08)
    & (stocks["trade_amount"] >= 500_000_000)
)
candidates = stocks[cond_w4].copy()
candidates["score"] = candidates["range20"] + candidates["ret60"] + candidates["ma60_dist"]

df_indexed = stocks.set_index(["asset_code", "trade_date"])
all_dates = sorted(stocks["trade_date"].unique())
date_to_idx = {d: i for i, d in enumerate(all_dates)}
asset_dates = stocks.groupby("asset_code")["trade_date"].apply(list).to_dict()


def get_nth_day(code, sig, n):
    future = [d for d in asset_dates.get(code, []) if d > pd.Timestamp(sig)]
    return future[n - 1] if len(future) >= n else None


def get_future_prices(code, start, n):
    future = [d for d in asset_dates.get(code, []) if d >= pd.Timestamp(start)][: n + 1]
    rows = []
    for d in future:
        try:
            r = df_indexed.loc[(code, d)]
            rows.append(
                {
                    "trade_date": d,
                    "open": float(r["open_price"]),
                    "high": float(r["high_price"]),
                    "low": float(r["low_price"]),
                    "close": float(r["close_price"]),
                }
            )
        except KeyError:
            pass
    return pd.DataFrame(rows) if rows else None


def simulate_exit(prices, stop=-0.25, ef=-0.08, efd=3, ts=0.20, tp=0.20, mh=30):
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry = float(prices.iloc[0]["open"])
    peak = entry
    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo = float(row["low"])
        hi = float(row["high"])
        close = float(row["close"])
        low_ret = (lo - entry) / entry
        if i < efd and low_ret <= ef:
            return row["trade_date"], ef - COST, "EARLY_FAIL"
        if low_ret <= stop:
            return row["trade_date"], stop - COST, "STOP"
        peak = max(peak, hi)
        if (peak - entry) / entry >= ts and (close - peak) / peak <= -tp:
            return row["trade_date"], (close - entry) / entry - COST, "TRAIL"
        if i >= mh - 1:
            return row["trade_date"], (close - entry) / entry - COST, "MAX"
    last = prices.iloc[-1]
    return last["trade_date"], (float(last["close"]) - entry) / entry - COST, "MAX"


def metric(trades, period):
    s = trades[trades["period"] == period]
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
        "early": int((s["reason"] == "EARLY_FAIL").sum()),
    }


def run_bt(label, delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05,
           entry_body=0.0, entry_ret20_min=None, entry_ma20_min=None, entry_next_body_min=None,
           stop=-0.25, ef=-0.08, efd=3, ts=0.20, tp=0.20, mh=30, ml_stop=-0.15,
           cadence_days=5, regime="KOSPI_ma60"):
    sig_dates = sorted(candidates["trade_date"].unique())
    cadence = []
    prev = None
    for d in sig_dates:
        idx = date_to_idx.get(d)
        if idx is None:
            continue
        if prev is None or idx - prev >= cadence_days:
            cadence.append(d)
            prev = idx

    trades = []
    month_pnl = {}
    open_until = None
    for sd in cadence:
        sp = pd.Timestamp(sd)
        ym = (sp.year, sp.month)
        if month_pnl.get(ym, 0) <= ml_stop:
            continue
        if open_until is not None and sp <= open_until:
            continue
        if not pass_regime(sp, regime):
            continue

        day_candidates = candidates[candidates["trade_date"] == sp].sort_values("score", ascending=False).head(top_n)
        selected = None
        for _, cand in day_candidates.iterrows():
            code = cand["asset_code"]
            entry_check_day = get_nth_day(code, sp, delay)
            if entry_check_day is None:
                continue
            try:
                er = df_indexed.loc[(code, entry_check_day)]
            except KeyError:
                continue
            if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < entry_drawdown:
                continue
            if float(er["candle_loc"]) < entry_loc:
                continue
            if float(er["upper_shadow"]) > entry_shadow:
                continue
            if float(er["body_ret"]) < entry_body:
                continue
            if entry_ret20_min is not None and float(er["ret20"]) < entry_ret20_min:
                continue
            if entry_ma20_min is not None and (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"]) < entry_ma20_min:
                continue
            next_day = get_nth_day(code, entry_check_day, 1)
            if next_day is None:
                continue
            if entry_next_body_min is not None:
                try:
                    nr = df_indexed.loc[(code, next_day)]
                    if float(nr["body_ret"]) < entry_next_body_min:
                        continue
                except KeyError:
                    continue
            selected = (cand, entry_check_day, next_day)
            break
        if selected is None:
            continue

        cand, entry_check_day, execution_day = selected
        code = cand["asset_code"]
        future = get_future_prices(code, execution_day, mh + 1)
        if future is None or len(future) < 2:
            continue
        exit_day, ret, reason = simulate_exit(future, stop=stop, ef=ef, efd=efd, ts=ts, tp=tp, mh=mh)
        if exit_day is None:
            continue
        exit_month = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_month] = month_pnl.get(exit_month, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = "pre" if sp <= pd.Timestamp(PRE_END) else ("train" if sp <= pd.Timestamp(TRAIN_END) else "post")
        trades.append(
            {
                "variant": label,
                "period": period,
                "signal_date": sd,
                "asset_code": code,
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


def pass_regime(signal_date, regime):
    if regime in (None, "none"):
        return True
    if regime == "both_ma60":
        return (
            index_regime_maps.get("KOSPI_ma60", {}).get(signal_date, True)
            and index_regime_maps.get("KOSDAQ_ma60", {}).get(signal_date, True)
        )
    if regime == "both_ma20":
        return (
            index_regime_maps.get("KOSPI_ma20", {}).get(signal_date, True)
            and index_regime_maps.get("KOSDAQ_ma20", {}).get(signal_date, True)
        )
    return index_regime_maps.get(regime, regime_map60).get(signal_date, True)


def write_report(path, rows, trades_path=None, readout=None):
    lines = [
        "# W4 V3-FIN Early-Fail Reduction\n\n",
        "date: 2026-05-26\n",
        f"pre: {PRE_START}~{PRE_END}\n",
        f"train: {TRAIN_START}~{TRAIN_END}\n",
        f"post: {POST_START}~{POST_END}\n\n",
        "## Result\n\n",
        "| variant | period | avg monthly | total | worst | N | win | early fail |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|\n",
    ]
    for label, period, avg, total, worst, n, win, early in rows:
        if avg is None:
            lines.append(f"| {label} | {period} | - | - | - | 0 | - | 0 |\n")
        else:
            lines.append(
                f"| {label} | {period} | {avg*100:.2f}% | {total*100:.2f}% | "
                f"{worst*100:.2f}% | {n} | {win*100:.1f}% | {early} |\n"
            )
    lines.append("\n## Readout\n\n")
    if readout:
        lines.extend(readout)
    else:
        lines.extend(
            [
                "- Baseline is V3-FIN from the latest Claude run.\n",
                "- Variants only test early-fail reduction or slightly softer early-fail exits.\n",
                "- Promote only if train approaches 15% while pre/post stay positive and early-fail count falls.\n",
            ]
        )
    if trades_path:
        lines.append(f"- Trades: `{trades_path}`\n")
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)


def summarize_variant(label, trades):
    rows = []
    for period in ["pre", "train", "post"]:
        m = metric(trades, period)
        if m is None:
            rows.append([label, period, None, None, None, 0, None, 0])
        else:
            rows.append([label, period, m["avg"], m["total"], m["worst"], m["n"], m["win"], m["early"]])
    return rows


def main():
    variants = [
        ("V3-FIN", {}),
        ("body>=2", {"entry_body": 0.02}),
        ("loc>=75", {"entry_loc": 0.75}),
        ("drawdown>=0", {"entry_drawdown": 0.0}),
        ("ret20>=20", {"entry_ret20_min": 0.20}),
        ("ma20dist>=5", {"entry_ma20_min": 0.05}),
        ("next_body>=0", {"entry_next_body_min": 0.0}),
        ("body2+loc75", {"entry_body": 0.02, "entry_loc": 0.75}),
        ("body2+ret20", {"entry_body": 0.02, "entry_ret20_min": 0.20}),
        ("soft_ef10", {"ef": -0.10}),
        ("soft_ef12", {"ef": -0.12}),
    ]
    results = []
    trade_frames = []
    for label, params in variants:
        trades = run_bt(label, **params)
        trade_frames.append(trades)
        results.extend(summarize_variant(label, trades))

    trades_path = ".Codex/reports/2026-05-26_w4-v3fin-early-fail-trades.csv"
    out = pd.concat(trade_frames, ignore_index=True) if trade_frames else pd.DataFrame()
    out.to_csv(trades_path, index=False, encoding="utf-8-sig")
    report_path = ".Codex/reports/2026-05-26_w4-v3fin-early-fail.md"
    write_report(report_path, results, trades_path)
    print(f"saved {report_path}")


if __name__ == "__main__":
    main()
