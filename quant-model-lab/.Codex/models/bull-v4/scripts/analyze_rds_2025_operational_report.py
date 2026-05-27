"""RDS 2025 operational replay report for Bull V4.

Inputs:
  .Codex/tmp/rds_market_daily_price_2024-09_2025-12.csv

Writes:
  .Codex/reports/2026-05-27_bull-v4-rds-2025-operational-trades.csv
  .Codex/reports/2026-05-27_bull-v4-rds-2025-weekly.csv
  .Codex/reports/2026-05-27_bull-v4-rds-2025-operational-report.md
"""
from __future__ import annotations

import math
from pathlib import Path

import pandas as pd


REPORT_DATE = "2026-05-27"
ROOT = Path(".")
INPUT = ROOT / ".Codex/tmp/rds_market_daily_price_2024-09_2025-12.csv"
OUT_TRADES = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2025-operational-trades.csv"
OUT_WEEKLY = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2025-weekly.csv"
OUT_MD = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2025-operational-report.md"

CAPITAL = 1_000_000_000
POSITION_CASH = 100_000_000
LIQUIDITY_CAP = 0.03
MAX_POSITIONS = 10
MAX_BUYS_PER_DAY = 5
COST = 0.003

SIGNAL_FROM = pd.Timestamp("2025-01-01")
SIGNAL_TO = pd.Timestamp("2025-12-31")
POST_FROM = pd.Timestamp("2025-08-01")
POST_TO = pd.Timestamp("2025-12-31")

AP06 = {
    "label": "BULL_V4_BALANCED_PAPER_ap06",
    "delay": 5,
    "entry_loc": 0.55,
    "entry_ma20_min": 0.02,
    "entry_next_body_min": 0.005,
    "range20_max": 0.40,
    "top_n": 50,
}


def pct(value: float | None) -> str:
    if value is None or pd.isna(value):
        return "-"
    return f"{value * 100:.2f}%"


def load_prices() -> pd.DataFrame:
    df = pd.read_csv(INPUT, parse_dates=["trade_date"])
    for col in ["open_price", "high_price", "low_price", "close_price", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["open_price", "high_price", "low_price", "close_price", "volume"])
    return df.sort_values(["asset_code", "trade_date"]).reset_index(drop=True)


def add_features(df: pd.DataFrame) -> pd.DataFrame:
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
    return df


def index_maps(df: pd.DataFrame) -> dict[str, dict[pd.Timestamp, bool]]:
    maps = {}
    for code in ["KOSPI", "KOSDAQ"]:
        part = df[(df["asset_type"] == "INDEX") & (df["asset_code"] == code)].copy().sort_values("trade_date")
        if len(part) == 0:
            continue
        part["ma20_idx"] = part["close_price"].rolling(20, min_periods=20).mean()
        part["ma60_idx"] = part["close_price"].rolling(60, min_periods=60).mean()
        maps[f"{code}_ma20"] = dict(zip(part["trade_date"], part["close_price"] > part["ma20_idx"]))
        maps[f"{code}_ma60"] = dict(zip(part["trade_date"], part["close_price"] > part["ma60_idx"]))
    return maps


def build_candidates(df: pd.DataFrame) -> pd.DataFrame:
    stocks = df[df["asset_type"] == "STOCK"].dropna(
        subset=["ma20", "ma60", "ret60", "range20", "vol_exp", "ma20_slope5", "ma60_slope5"]
    )
    cond = (
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
    candidates = stocks[cond].copy()
    candidates["score"] = candidates["range20"] + candidates["ret60"] + candidates["ma60_dist"]
    return candidates


def make_helpers(df: pd.DataFrame):
    stocks = df[df["asset_type"] == "STOCK"].copy()
    indexed = stocks.set_index(["asset_code", "trade_date"])
    frames = {code: group.sort_values("trade_date").reset_index(drop=True) for code, group in stocks.groupby("asset_code")}
    frame_pos = {code: {pd.Timestamp(d): i for i, d in frame["trade_date"].items()} for code, frame in frames.items()}
    asset_dates = {code: list(frame["trade_date"]) for code, frame in frames.items()}
    date_pos = {code: {pd.Timestamp(d): i for i, d in enumerate(dates)} for code, dates in asset_dates.items()}
    trading_days = sorted(stocks["trade_date"].drop_duplicates())
    return indexed, frames, frame_pos, asset_dates, date_pos, trading_days


def nth_day(code: str, date, n: int, asset_dates, date_pos):
    dates = asset_dates.get(code)
    pos = date_pos.get(code, {}).get(pd.Timestamp(date))
    if dates is None or pos is None:
        return None
    idx = pos + n
    return dates[idx] if idx < len(dates) else None


def future_rows(code: str, entry_date, n: int, frames, frame_pos):
    frame = frames.get(code)
    pos = frame_pos.get(code, {}).get(pd.Timestamp(entry_date))
    if frame is None or pos is None:
        return None
    chunk = frame.iloc[pos : pos + n + 1]
    if len(chunk) == 0:
        return None
    return pd.DataFrame(
        {
            "trade_date": chunk["trade_date"].values,
            "open": chunk["open_price"].astype(float).values,
            "high": chunk["high_price"].astype(float).values,
            "low": chunk["low_price"].astype(float).values,
            "close": chunk["close_price"].astype(float).values,
            "ma20": chunk["ma20"].astype(float).values,
        }
    )


def should_early_fail(row, entry, ef, ef_mode):
    low_ret = (float(row["low"]) - entry) / entry
    close_ret = (float(row["close"]) - entry) / entry
    if ef_mode == "close":
        return close_ret <= ef
    return low_ret <= ef


def simulate_exit(prices):
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry = float(prices.iloc[0]["open"])
    peak = entry
    extended = False
    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo = float(row["low"])
        hi = float(row["high"])
        close = float(row["close"])
        low_ret = (lo - entry) / entry
        if i < 3 and should_early_fail(row, entry, -0.06, "close"):
            return row["trade_date"], -0.06 - COST, "EARLY_FAIL_CLOSE"
        if low_ret <= -0.12:
            return row["trade_date"], -0.12 - COST, "STOP"
        peak = max(peak, hi)
        if peak >= entry * 1.20 and (close - peak) / peak <= -0.20:
            return row["trade_date"], (close - entry) / entry - COST, "TRAIL"
        if i >= 29 and not extended:
            ma20 = row.get("ma20")
            if ((close - entry) / entry >= 0.25) and ma20 is not None and close > float(ma20):
                extended = True
                continue
            return row["trade_date"], (close - entry) / entry - COST, "MAX"
        if extended and (close - peak) / peak <= -0.20:
            return row["trade_date"], (close - entry) / entry - COST, "EXT_TRAIL"
        if i >= 59:
            return row["trade_date"], (close - entry) / entry - COST, "MAX"
    last = prices.iloc[-1]
    return last["trade_date"], (float(last["close"]) - entry) / entry - COST, "MAX"


def run_ap06(df, candidates, maps):
    indexed, frames, frame_pos, asset_dates, date_pos, trading_days = make_helpers(df)
    trades = []
    open_positions = []
    for sd in sorted(candidates["trade_date"].unique()):
        sp = pd.Timestamp(sd)
        if sp < SIGNAL_FROM or sp > SIGNAL_TO:
            continue
        open_positions = [p for p in open_positions if p > sp]
        if not (maps.get("KOSPI_ma20", {}).get(sp, False) and maps.get("KOSDAQ_ma20", {}).get(sp, False)):
            continue
        slots = MAX_POSITIONS - len(open_positions)
        if slots <= 0:
            continue
        bought = 0
        day_cands = (
            candidates[(candidates["trade_date"] == sp) & (candidates["range20"] <= AP06["range20_max"])]
            .sort_values("score", ascending=False)
            .head(AP06["top_n"])
        )
        for _, cand in day_cands.iterrows():
            if bought >= min(slots, MAX_BUYS_PER_DAY):
                break
            code = cand["asset_code"]
            entry_check = nth_day(code, sp, AP06["delay"], asset_dates, date_pos)
            if entry_check is None:
                continue
            try:
                er = indexed.loc[(code, entry_check)]
            except KeyError:
                continue
            if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < -0.05:
                continue
            if float(er["candle_loc"]) < AP06["entry_loc"]:
                continue
            if float(er["upper_shadow"]) > 0.08:
                continue
            if float(er["body_ret"]) < 0:
                continue
            ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
            if ma20_dist < AP06["entry_ma20_min"]:
                continue
            entry_date = nth_day(code, entry_check, 1, asset_dates, date_pos)
            if entry_date is None:
                continue
            try:
                nr = indexed.loc[(code, entry_date)]
            except KeyError:
                continue
            if float(nr["body_ret"]) < AP06["entry_next_body_min"]:
                continue
            trade_amount = float(er["close_price"]) * float(er["volume"])
            if POSITION_CASH > trade_amount * LIQUIDITY_CAP:
                continue
            rows = future_rows(code, entry_date, 61, frames, frame_pos)
            if rows is None or len(rows) < 2:
                continue
            exit_date, ret, reason = simulate_exit(rows)
            if exit_date is None:
                continue
            trades.append(
                {
                    "model": AP06["label"],
                    "signal_date": sp,
                    "asset_code": code,
                    "asset_name": cand["asset_name"],
                    "entry_check_date": entry_check,
                    "entry_date": entry_date,
                    "exit_date": exit_date,
                    "ret": ret,
                    "pnl_krw": ret * POSITION_CASH,
                    "reason": reason,
                    "sig_range20": cand["range20"],
                    "sig_ret60": cand["ret60"],
                    "entry_ma20_dist": ma20_dist,
                    "entry_trade_amount": trade_amount,
                }
            )
            open_positions.append(pd.Timestamp(exit_date))
            bought += 1
    return pd.DataFrame(trades)


def run_old_daily_momentum(df):
    stocks = df[df["asset_type"] == "STOCK"].copy()
    indexed = stocks.set_index(["asset_code", "trade_date"])
    trading_days = sorted(stocks["trade_date"].drop_duplicates())
    rows = []
    for i in range(6, len(trading_days)):
        exec_day = trading_days[i]
        if exec_day < SIGNAL_FROM or exec_day > SIGNAL_TO:
            continue
        signal_day = trading_days[i - 1]
        lookback_day = trading_days[i - 6]
        day = stocks[stocks["trade_date"] == exec_day][["asset_code", "asset_name", "open_price", "close_price", "market_cap" if "market_cap" in stocks.columns else "volume"]].copy()
        sig = stocks[stocks["trade_date"] == signal_day][["asset_code", "close_price"]].rename(columns={"close_price": "signal_close"})
        lb = stocks[stocks["trade_date"] == lookback_day][["asset_code", "close_price"]].rename(columns={"close_price": "lookback_close"})
        merged = day.merge(sig, on="asset_code").merge(lb, on="asset_code")
        merged = merged[(merged["open_price"] > 0) & (merged["close_price"] > 0) & (merged["lookback_close"] > 0)]
        if len(merged) == 0:
            continue
        merged["score"] = (merged["signal_close"] - merged["lookback_close"]) / merged["lookback_close"]
        pick = merged.sort_values(["score", "volume", "asset_code"], ascending=[False, False, True]).iloc[0]
        ret = (float(pick["close_price"]) - float(pick["open_price"])) / float(pick["open_price"])
        rows.append(
            {
                "model": "OLD_DAILY_MOMENTUM_TOP1",
                "signal_date": signal_day,
                "asset_code": pick["asset_code"],
                "asset_name": pick["asset_name"],
                "entry_date": exec_day,
                "exit_date": exec_day,
                "ret": ret,
                "pnl_krw": ret * POSITION_CASH,
                "reason": "SAME_DAY_CLOSE",
            }
        )
    return pd.DataFrame(rows)


def period_metrics(trades):
    if len(trades) == 0:
        return {}
    out = {}
    s = trades.copy()
    s["exit_month"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    s["exit_week"] = pd.to_datetime(s["exit_date"]).dt.strftime("%GW%V")
    monthly = s.groupby("exit_month")["pnl_krw"].sum() / CAPITAL
    weekly = s.groupby("exit_week")["pnl_krw"].sum() / CAPITAL
    entry_counts = s.groupby(pd.to_datetime(s["entry_date"]).dt.date).size()
    out["trades"] = len(s)
    out["win"] = float((s["ret"] > 0).mean())
    out["avg_trade_ret"] = float(s["ret"].mean())
    out["total_capital"] = float(s["pnl_krw"].sum() / CAPITAL)
    out["avg_month"] = float(monthly.mean()) if len(monthly) else None
    out["best_month"] = float(monthly.max()) if len(monthly) else None
    out["worst_month"] = float(monthly.min()) if len(monthly) else None
    out["months_ge20"] = int((monthly >= 0.20).sum())
    out["month_count"] = len(monthly)
    out["avg_week"] = float(weekly.mean()) if len(weekly) else None
    out["best_week"] = float(weekly.max()) if len(weekly) else None
    out["worst_week"] = float(weekly.min()) if len(weekly) else None
    out["weeks_ge20"] = int((weekly >= 0.20).sum())
    out["week_count"] = len(weekly)
    out["active_entry_days"] = int(len(entry_counts))
    out["avg_entries_active_day"] = float(entry_counts.mean()) if len(entry_counts) else None
    out["entry_days_ge2"] = int((entry_counts >= 2).sum())
    out["entry_days_ge2_rate"] = float((entry_counts >= 2).mean()) if len(entry_counts) else None
    return out


def weekly_table(ap06, old):
    rows = []
    for label, trades in [("patched_ap06", ap06), ("old_daily_momentum", old)]:
        if len(trades) == 0:
            continue
        w = trades.copy()
        w["week"] = pd.to_datetime(w["exit_date"]).dt.strftime("%GW%V")
        grouped = w.groupby("week").agg(
            trades=("asset_code", "count"),
            pnl_krw=("pnl_krw", "sum"),
            avg_trade_ret=("ret", "mean"),
            wins=("ret", lambda x: int((x > 0).sum())),
        ).reset_index()
        grouped["capital_return"] = grouped["pnl_krw"] / CAPITAL
        grouped["model"] = label
        rows.append(grouped)
    return pd.concat(rows, ignore_index=True) if rows else pd.DataFrame()


def main():
    df = add_features(load_prices())
    maps = index_maps(df)
    candidates = build_candidates(df)
    ap06 = run_ap06(df, candidates, maps)
    old = run_old_daily_momentum(df)
    ap06.to_csv(OUT_TRADES, index=False, encoding="utf-8-sig")
    weekly = weekly_table(ap06, old)
    weekly.to_csv(OUT_WEEKLY, index=False, encoding="utf-8-sig")

    post_ap06 = ap06[(pd.to_datetime(ap06["signal_date"]) >= POST_FROM) & (pd.to_datetime(ap06["signal_date"]) <= POST_TO)]
    post_old = old[(pd.to_datetime(old["entry_date"]) >= POST_FROM) & (pd.to_datetime(old["entry_date"]) <= POST_TO)]
    all_ap06 = ap06[(pd.to_datetime(ap06["signal_date"]) >= SIGNAL_FROM) & (pd.to_datetime(ap06["signal_date"]) <= SIGNAL_TO)]
    all_old = old[(pd.to_datetime(old["entry_date"]) >= SIGNAL_FROM) & (pd.to_datetime(old["entry_date"]) <= SIGNAL_TO)]
    metrics = {
        "patched_2025": period_metrics(all_ap06),
        "patched_post": period_metrics(post_ap06),
        "old_2025": period_metrics(all_old),
        "old_post": period_metrics(post_old),
    }

    lines = [
        "# Bull V4 RDS 2025 Weekly Operational Report\n\n",
        f"date: {REPORT_DATE}\n",
        "source: RDS `market_daily_price`, exported 2024-09-01~2025-12-31 for 2025 replay\n",
        f"capital: {CAPITAL:,}\n",
        f"position_cash: {POSITION_CASH:,}\n",
        f"model: `{AP06['label']}`\n\n",
        "## Summary\n\n",
        "| scope | trades | total on capital | avg month | best month | worst month | months >=20% | avg week | best week | weeks >=20% | win | active entry days | entry days >=2 |\n",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for label in ["patched_2025", "patched_post", "old_2025", "old_post"]:
        m = metrics[label]
        lines.append(
            f"| {label} | {m.get('trades', 0)} | {pct(m.get('total_capital'))} | {pct(m.get('avg_month'))} | "
            f"{pct(m.get('best_month'))} | {pct(m.get('worst_month'))} | {m.get('months_ge20', 0)}/{m.get('month_count', 0)} | "
            f"{pct(m.get('avg_week'))} | {pct(m.get('best_week'))} | {m.get('weeks_ge20', 0)}/{m.get('week_count', 0)} | "
            f"{pct(m.get('win'))} | {m.get('active_entry_days', 0)} | {m.get('entry_days_ge2', 0)} ({pct(m.get('entry_days_ge2_rate'))}) |\n"
        )

    lines.extend([
        "\n## Latest Weekly Rows\n\n",
        "| model | week | trades | capital return | avg trade return | wins |\n",
        "|---|---|---:|---:|---:|---:|\n",
    ])
    if len(weekly):
        tail = weekly.sort_values(["week", "model"]).tail(20)
        for _, row in tail.iterrows():
            lines.append(
                f"| {row['model']} | {row['week']} | {int(row['trades'])} | {pct(row['capital_return'])} | "
                f"{pct(row['avg_trade_ret'])} | {int(row['wins'])} |\n"
            )

    lines.extend([
        "\n## Readout\n\n",
        "- The patched model is compared against the old homepage placeholder reconstructed as 5-day daily momentum top-1, same-day close.\n",
        "- The 20% threshold is evaluated on capital, not single-position trade return.\n",
        "- The 2-per-day threshold is evaluated on actual entry dates.\n",
        f"- Trades CSV: `{OUT_TRADES}`\n",
        f"- Weekly CSV: `{OUT_WEEKLY}`\n",
    ])
    OUT_MD.write_text("".join(lines), encoding="utf-8")
    print(f"saved {OUT_MD}")
    print(f"saved {OUT_TRADES}")
    print(f"saved {OUT_WEEKLY}")


if __name__ == "__main__":
    main()
