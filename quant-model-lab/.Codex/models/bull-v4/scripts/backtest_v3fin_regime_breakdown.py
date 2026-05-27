"""Regime-aware retest for original W4/V3-FIN model.

Uses signal-date market regime only; no future returns in regime labels.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-regime-breakdown.md
  .Codex/reports/2026-05-27_w4-v3fin-regime-breakdown-trades.csv
"""
import os
import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority

import pandas as pd

os.environ.setdefault("W4_PRE_START", "2012-01-01")

import backtest_v3fin_post_exit_grid as post_grid


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-regime-breakdown.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-regime-breakdown-trades.csv"

base = post_grid.prev.base


def _index_frame(code):
    idx = base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == code)].copy()
    idx = idx.sort_values("trade_date")
    idx["idx_ret"] = idx["close_price"].pct_change()
    idx["vol20"] = idx["idx_ret"].rolling(20, min_periods=20).std()
    idx["idx_high20"] = idx["high_price"].rolling(20, min_periods=20).max()
    idx["drawdown20"] = idx["close_price"] / idx["idx_high20"] - 1
    return idx.set_index("trade_date")


KOSPI = _index_frame("KOSPI")
KOSDAQ = _index_frame("KOSDAQ")

STOCKS = base.df[base.df["asset_type"] == "STOCK"].copy()
STOCKS["above_ma20"] = STOCKS["close_price"] > STOCKS["ma20"]
STOCKS["above_ma60"] = STOCKS["close_price"] > STOCKS["ma60"]
STOCKS["ret5"] = STOCKS.groupby("asset_code")["close_price"].pct_change(5)
STOCKS["trade_amount"] = STOCKS["close_price"] * STOCKS["volume"]

BREATH = STOCKS.groupby("trade_date").agg(
    breadth_ma20=("above_ma20", "mean"),
    breadth_ma60=("above_ma60", "mean"),
    advance_ratio_5d=("ret5", lambda s: (s > 0).mean()),
    total_trade_amount=("trade_amount", "sum"),
)
BREATH["liquidity_ma20"] = BREATH["total_trade_amount"].rolling(20, min_periods=20).mean()
BREATH["liquidity_trend"] = BREATH["total_trade_amount"] / BREATH["liquidity_ma20"] - 1


def _bool_idx(frame, date, column):
    try:
        return bool(frame.loc[date, column])
    except KeyError:
        return False


def _float_idx(frame, date, column, default=0.0):
    try:
        v = frame.loc[date, column]
        return float(v) if pd.notna(v) else default
    except KeyError:
        return default


def regime_features(trade_date):
    d = pd.Timestamp(trade_date)
    kospi_above_ma20 = _bool_idx(KOSPI, d, "close_price") and _float_idx(KOSPI, d, "close_price") > _float_idx(KOSPI, d, "ma20")
    kosdaq_above_ma20 = _bool_idx(KOSDAQ, d, "close_price") and _float_idx(KOSDAQ, d, "close_price") > _float_idx(KOSDAQ, d, "ma20")
    kospi_above_ma60 = _bool_idx(KOSPI, d, "close_price") and _float_idx(KOSPI, d, "close_price") > _float_idx(KOSPI, d, "ma60")
    kosdaq_above_ma60 = _bool_idx(KOSDAQ, d, "close_price") and _float_idx(KOSDAQ, d, "close_price") > _float_idx(KOSDAQ, d, "ma60")

    return {
        "kospi_above_ma20": kospi_above_ma20,
        "kosdaq_above_ma20": kosdaq_above_ma20,
        "kospi_above_ma60": kospi_above_ma60,
        "kosdaq_above_ma60": kosdaq_above_ma60,
        "kospi_ma20_slope": _float_idx(KOSPI, d, "ma20_slope5"),
        "kosdaq_ma20_slope": _float_idx(KOSDAQ, d, "ma20_slope5"),
        "breadth_ma20": _float_idx(BREATH, d, "breadth_ma20", 0.5),
        "breadth_ma60": _float_idx(BREATH, d, "breadth_ma60", 0.5),
        "advance_ratio_5d": _float_idx(BREATH, d, "advance_ratio_5d", 0.5),
        "volatility_20": max(_float_idx(KOSPI, d, "vol20"), _float_idx(KOSDAQ, d, "vol20")),
        "liquidity_trend": _float_idx(BREATH, d, "liquidity_trend"),
    }


def classify_regime(features):
    if (
        features["breadth_ma20"] <= 0.20
        and features["volatility_20"] >= 0.04
        and not features["kospi_above_ma60"]
        and not features["kosdaq_above_ma60"]
    ):
        return "CRASH"

    bull_score = sum(
        [
            features["kospi_above_ma20"],
            features["kosdaq_above_ma20"],
            features["kospi_above_ma60"],
            features["kosdaq_above_ma60"],
            features["kospi_ma20_slope"] > 0,
            features["kosdaq_ma20_slope"] > 0,
            features["breadth_ma20"] >= 0.55,
            features["volatility_20"] <= 0.025,
            features["liquidity_trend"] >= 0,
        ]
    )
    bear_score = sum(
        [
            not features["kospi_above_ma60"],
            not features["kosdaq_above_ma60"],
            features["kospi_ma20_slope"] < 0,
            features["kosdaq_ma20_slope"] < 0,
            features["breadth_ma20"] <= 0.35,
            features["volatility_20"] >= 0.03,
            features["liquidity_trend"] < 0,
        ]
    )

    if bull_score >= 7:
        return "BULL"
    if bear_score >= 5:
        return "BEAR"
    return "SIDEWAYS"


def add_regime(trades):
    rows = []
    for _, row in trades.iterrows():
        features = regime_features(row["signal_date"])
        regime = classify_regime(features)
        out = row.to_dict()
        out.update(
            {
                "regime": regime,
                "breadth_ma20": features["breadth_ma20"],
                "breadth_ma60": features["breadth_ma60"],
                "volatility_20": features["volatility_20"],
                "liquidity_trend": features["liquidity_trend"],
            }
        )
        rows.append(out)
    return pd.DataFrame(rows)


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
    variants = [
        ("baseline_low_touch", post_grid.EXIT_VARIANTS[0][1]),
        ("best_ef_close6", post_grid.EXIT_VARIANTS[1][1]),
    ]
    frames = []
    for label, params in variants:
        trades = post_grid.run_bt(label, params)
        frames.append(add_regime(trades))

    all_trades = pd.concat(frames, ignore_index=True)
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    lines = [
        "# W4 V3-FIN Regime Breakdown\n\n",
        f"date: {REPORT_DATE}\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Overall\n\n",
        "| variant | period | avg monthly | total | worst | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for variant in all_trades["variant"].unique():
        vt = all_trades[all_trades["variant"] == variant]
        for period, start, end in post_grid.PERIODS:
            s = vt[(pd.to_datetime(vt["signal_date"]) >= pd.Timestamp(start)) & (pd.to_datetime(vt["signal_date"]) <= pd.Timestamp(end))]
            m = metric(s)
            if m is None:
                continue
            lines.append(
                f"| {variant} | {period} | {pct(m['avg'])} | {pct(m['total'])} | {pct(m['worst'])} | "
                f"{m['n']} | {pct(m['win'])} | {m['early']} | {m['stop']} |\n"
            )

    lines.extend([
        "\n## By Regime\n\n",
        "| variant | period | regime | avg monthly | total | worst | N | win | early fail | stop |\n",
        "|---|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for variant in all_trades["variant"].unique():
        vt = all_trades[all_trades["variant"] == variant]
        for period, start, end in post_grid.PERIODS:
            ps = vt[(pd.to_datetime(vt["signal_date"]) >= pd.Timestamp(start)) & (pd.to_datetime(vt["signal_date"]) <= pd.Timestamp(end))]
            for regime in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
                m = metric(ps[ps["regime"] == regime])
                if m is None:
                    continue
                lines.append(
                    f"| {variant} | {period} | {regime} | {pct(m['avg'])} | {pct(m['total'])} | {pct(m['worst'])} | "
                    f"{m['n']} | {pct(m['win'])} | {m['early']} | {m['stop']} |\n"
                )

    lines.extend([
        "\n## Readout\n\n",
        "- Regime labels use signal-date KOSPI/KOSDAQ trend, breadth, volatility, and liquidity only.\n",
        "- `best_ef_close6` is current original-model retest candidate from post exit grid.\n",
        "- Next decision: tighten SIDEWAYS or block BEAR/CRASH if breakdown shows weak expectancy.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ])

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
