"""
backtest_market_regime_model.py

Generates a historical regime snapshot for every trade date in the DB.
Uses market_regime_model.compute_snapshot() — same classifier as realtime.

No look-ahead bias: each snapshot uses only data available on or before trade_date.

Writes:
  .Codex/reports/2026-05-27_market-regime-snapshot.csv
  .Codex/reports/2026-05-27_market-regime-model.md
"""
import warnings
import os
import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority

import pandas as pd
import psycopg2

from market_regime_model import compute_snapshot, features_from_index_levels

warnings.filterwarnings("ignore")

DB = dict(host="localhost", port=5432, dbname="marketpulse",
          user="postgres", password="postgreskh")

REPORT_DATE   = "2026-05-27"
OUT_CSV       = f".Codex/reports/{REPORT_DATE}_market-regime-snapshot.csv"
OUT_MD        = f".Codex/reports/{REPORT_DATE}_market-regime-model.md"
DATE_START    = os.getenv("REGIME_START", "2012-01-01")
DATE_END      = os.getenv("REGIME_END",   "2026-05-27")


# ── Load data ─────────────────────────────────────────────────────────────────

def load_data() -> pd.DataFrame:
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
        params=[DATE_START, DATE_END],
        parse_dates=["trade_date"],
    )
    conn.close()
    return raw


# ── Build index frames ────────────────────────────────────────────────────────

def build_index_frame(df: pd.DataFrame, code: str) -> pd.DataFrame:
    idx = df[(df["asset_type"] == "INDEX") & (df["asset_code"] == code)].copy()
    idx = idx.sort_values("trade_date").reset_index(drop=True)
    idx["daily_ret"]   = idx["close_price"].pct_change()
    idx["ma20"]        = idx["close_price"].rolling(20, min_periods=20).mean()
    idx["ma60"]        = idx["close_price"].rolling(60, min_periods=60).mean()
    idx["ma20_slope5"] = (idx["ma20"] - idx["ma20"].shift(5)) / idx["ma20"].shift(5)
    idx["vol20"]       = idx["daily_ret"].rolling(20, min_periods=20).std()
    return idx.set_index("trade_date")


# ── Build market breadth / liquidity ─────────────────────────────────────────

def build_breadth_frame(df: pd.DataFrame) -> pd.DataFrame:
    stocks = df[df["asset_type"] == "STOCK"].copy()
    g = stocks.groupby("asset_code", group_keys=False)
    stocks["ma20"]          = g["close_price"].transform(
        lambda x: x.rolling(20, min_periods=20).mean())
    stocks["ma60"]          = g["close_price"].transform(
        lambda x: x.rolling(60, min_periods=60).mean())
    stocks["above_ma20"]    = stocks["close_price"] > stocks["ma20"]
    stocks["above_ma60"]    = stocks["close_price"] > stocks["ma60"]
    stocks["ret5"]          = g["close_price"].transform(
        lambda x: x.pct_change(5))
    stocks["trade_amount"]  = stocks["close_price"] * stocks["volume"]

    breadth = stocks.groupby("trade_date").agg(
        breadth_ma20       = ("above_ma20", "mean"),
        breadth_ma60       = ("above_ma60", "mean"),
        advance_ratio_5d   = ("ret5", lambda s: (s > 0).mean()),
        total_trade_amount = ("trade_amount", "sum"),
    )
    breadth["liq_ma20"]      = breadth["total_trade_amount"].rolling(20, min_periods=20).mean()
    breadth["liquidity_trend"] = breadth["total_trade_amount"] / breadth["liq_ma20"] - 1
    return breadth


# ── Snapshot builder ──────────────────────────────────────────────────────────

def _safe(frame, date, col, default=None):
    try:
        v = frame.loc[date, col]
        return float(v) if pd.notna(v) else default
    except KeyError:
        return default


def build_snapshots(df: pd.DataFrame) -> pd.DataFrame:
    kospi  = build_index_frame(df, "KOSPI")
    kosdaq = build_index_frame(df, "KOSDAQ")
    breadth = build_breadth_frame(df)

    trade_dates = sorted(df["trade_date"].unique())
    rows = []
    for d in trade_dates:
        kc   = _safe(kospi,  d, "close_price")
        km20 = _safe(kospi,  d, "ma20")
        km60 = _safe(kospi,  d, "ma60")
        kslope = _safe(kospi, d, "ma20_slope5", 0.0)
        kvol   = _safe(kospi, d, "vol20", 0.0)

        qc   = _safe(kosdaq, d, "close_price")
        qm20 = _safe(kosdaq, d, "ma20")
        qm60 = _safe(kosdaq, d, "ma60")
        qslope = _safe(kosdaq, d, "ma20_slope5", 0.0)
        qvol   = _safe(kosdaq, d, "vol20", 0.0)

        # Skip dates where we don't have both indices
        if any(v is None for v in [kc, km20, km60, qc, qm20, qm60]):
            continue

        b_ma20 = _safe(breadth, d, "breadth_ma20", 0.50)
        b_ma60 = _safe(breadth, d, "breadth_ma60", 0.50)
        adv5   = _safe(breadth, d, "advance_ratio_5d", 0.50)
        liq    = _safe(breadth, d, "liquidity_trend", 0.0)
        if b_ma20 is None:
            b_ma20 = 0.50
        if b_ma60 is None:
            b_ma60 = 0.50

        features = features_from_index_levels(
            kospi_close=kc,  kospi_ma20=km20,  kospi_ma60=km60,
            kospi_ma20_slope_5d=kslope,         kospi_vol20=kvol,
            kosdaq_close=qc, kosdaq_ma20=qm20, kosdaq_ma60=qm60,
            kosdaq_ma20_slope_5d=qslope,        kosdaq_vol20=qvol,
            breadth_ma20=b_ma20, breadth_ma60=b_ma60,
            advance_ratio_5d=adv5, liquidity_trend=liq,
        )
        snap = compute_snapshot(features, trade_date=d)
        row = snap.as_dict()
        row["trade_date"] = d
        # Add raw inputs for traceability
        row["kospi_close"]  = kc
        row["kospi_ma20"]   = km20
        row["kospi_ma60"]   = km60
        row["kosdaq_close"] = qc
        row["kosdaq_ma20"]  = qm20
        row["kosdaq_ma60"]  = qm60
        rows.append(row)

    return pd.DataFrame(rows)


# ── Report ────────────────────────────────────────────────────────────────────

def build_report(snap: pd.DataFrame) -> str:
    def pct(v):
        return "-" if pd.isna(v) else f"{v * 100:.1f}%"

    regime_counts = snap["regime"].value_counts()
    total = len(snap)

    lines = [
        f"# Market Regime Model Snapshot\n\n",
        f"date: {REPORT_DATE}\n",
        f"period: {snap['trade_date'].min().date()} ~ {snap['trade_date'].max().date()}\n",
        f"total_dates: {total}\n\n",
        "## Regime Distribution\n\n",
        "| regime | days | pct |\n",
        "|---|---:|---:|\n",
    ]
    for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
        n = regime_counts.get(r, 0)
        lines.append(f"| {r} | {n} | {n / total * 100:.1f}% |\n")

    # Yearly regime breakdown
    snap["year"] = pd.to_datetime(snap["trade_date"]).dt.year
    lines += [
        "\n## Yearly Regime Distribution\n\n",
        "| year | BULL | SIDEWAYS | BEAR | CRASH | total |\n",
        "|---:|---:|---:|---:|---:|---:|\n",
    ]
    for yr, grp in snap.groupby("year"):
        cnt = grp["regime"].value_counts()
        n = len(grp)
        lines.append(
            f"| {yr} | {cnt.get('BULL', 0)} | {cnt.get('SIDEWAYS', 0)} | "
            f"{cnt.get('BEAR', 0)} | {cnt.get('CRASH', 0)} | {n} |\n"
        )

    # Avg indicators by regime
    lines += [
        "\n## Avg Indicators by Regime\n\n",
        "| regime | breadth_ma20 | volatility_20 | liquidity_trend | bull_score | bear_score |\n",
        "|---|---:|---:|---:|---:|---:|\n",
    ]
    for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
        g = snap[snap["regime"] == r]
        if len(g) == 0:
            continue
        lines.append(
            f"| {r} | {g['breadth_ma20'].mean():.3f} | "
            f"{g['volatility_20'].mean():.4f} | "
            f"{g['liquidity_trend'].mean():.3f} | "
            f"{g['bull_score'].mean():.1f} | "
            f"{g['bear_score'].mean():.1f} |\n"
        )

    lines += [
        "\n## Notes\n\n",
        "- Regime uses signal-date data only (no look-ahead).\n",
        "- `breadth_ma20` = fraction of STOCK universe with close > MA20.\n",
        "- `volatility_20` = max(KOSPI_vol20, KOSDAQ_vol20) daily return stddev.\n",
        "- `liquidity_trend` = current total trade amount / 20d avg - 1.\n",
        f"- Snapshot CSV: `{OUT_CSV}`\n",
        "- Same classifier used for realtime backend snapshot flow.\n",
    ]
    return "".join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading market data from DB...", flush=True)
    df = load_data()
    print(f"  loaded {len(df):,} rows", flush=True)

    print("Building regime snapshots...", flush=True)
    snap = build_snapshots(df)
    print(f"  {len(snap)} snapshot dates", flush=True)

    snap.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    print(f"  saved {OUT_CSV}", flush=True)

    report = build_report(snap)
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"  saved {OUT_MD}", flush=True)

    # Quick summary
    rc = snap["regime"].value_counts()
    print("\nRegime distribution:")
    for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
        n = rc.get(r, 0)
        print(f"  {r:8s} {n:4d}  ({n / len(snap) * 100:.1f}%)")


if __name__ == "__main__":
    main()
