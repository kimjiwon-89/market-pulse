"""
backtest_w4_regime_filter.py

Post-fix grid에서 얻은 인사이트:
  - both_ma20: train 46%, post -2.90% (2 trades) → post fails
  - KOSPI_ma60:  train 32%, post +5.35% (3 trades) → post fixed, train too low

두 extreme 사이를 메울 regime 필터 탐색:
  1. KOSPI_ma20 only           (not KOSDAQ constraint)
  2. both_ma20 + KOSPI 5d > 0  (momentum quality gate)
  3. both_ma20 + KOSDAQ slope > 0  (KOSDAQ MA20 slope gate)
  4. both_ma20 + KOSPI 5d > 0 + KOSDAQ slope > 0  (combined)
  5. KOSPI_ma20 + KOSDAQ slope > 0  (hybrid)
  6. Kma60_ext25 baseline (reference)
  7. bma20_ext25 baseline (reference)

Plus: year-by-year breakdown for top candidates.

Writes:
  .Codex/reports/2026-05-26_w4-regime-filter.md
  .Codex/reports/2026-05-26_w4-regime-filter-trades.csv
"""
import os
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd
import backtest_v3fin_early_fail as base

# ── extra indicators ───────────────────────────────────────────────────────────
_g = base.df.groupby("asset_code", group_keys=False)
base.df["ma5"]  = _g["close_price"].transform(lambda x: x.rolling(5,  min_periods=5).mean())
base.df["ma10"] = _g["close_price"].transform(lambda x: x.rolling(10, min_periods=10).mean())
_local = base.df[base.df["asset_type"] == "STOCK"].copy()
_lidx  = _local.set_index(["asset_code", "trade_date"])

# ── index-level momentum / slope maps ─────────────────────────────────────────
_kospi  = (base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == "KOSPI")]
           .copy().sort_values("trade_date"))
_kosdaq = (base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == "KOSDAQ")]
           .copy().sort_values("trade_date"))

# KOSPI 5-day return
_kospi["ret5"] = (_kospi["close_price"] - _kospi["close_price"].shift(5)) / _kospi["close_price"].shift(5)
kospi_ret5_map = dict(zip(_kospi["trade_date"], _kospi["ret5"]))

# KOSDAQ MA20 slope (5-day)
_kosdaq["ma20"] = _kosdaq["close_price"].rolling(20, min_periods=20).mean()
_kosdaq["slope5"] = (_kosdaq["ma20"] - _kosdaq["ma20"].shift(5)) / _kosdaq["ma20"].shift(5)
kosdaq_slope5_map = dict(zip(_kosdaq["trade_date"], _kosdaq["slope5"]))

# KOSDAQ 5-day return
_kosdaq["ret5"] = (_kosdaq["close_price"] - _kosdaq["close_price"].shift(5)) / _kosdaq["close_price"].shift(5)
kosdaq_ret5_map = dict(zip(_kosdaq["trade_date"], _kosdaq["ret5"]))

# KOSPI MA20 slope (5-day)
_kospi["ma20"] = _kospi["close_price"].rolling(20, min_periods=20).mean()
_kospi["slope5"] = (_kospi["ma20"] - _kospi["ma20"].shift(5)) / _kospi["ma20"].shift(5)
kospi_slope5_map = dict(zip(_kospi["trade_date"], _kospi["slope5"]))


def pass_ext_regime(signal_date, regime):
    """Extended regime checks including momentum and slope."""
    d = pd.Timestamp(signal_date)

    # standard checks from base
    if not base.pass_regime(d, regime.split("+")[0]):
        return False

    # additional gates
    parts = regime.split("+")
    for gate in parts[1:]:
        if gate == "kospi_ret5":
            v = kospi_ret5_map.get(d)
            if v is None or v <= 0:
                return False
        elif gate == "kosdaq_slope":
            v = kosdaq_slope5_map.get(d)
            if v is None or v <= 0:
                return False
        elif gate == "kospi_slope":
            v = kospi_slope5_map.get(d)
            if v is None or v <= 0:
                return False
        elif gate == "kosdaq_ret5":
            v = kosdaq_ret5_map.get(d)
            if v is None or v <= 0:
                return False

    return True


PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]


def get_future_rows(code, start, n):
    future = [d for d in base.asset_dates.get(code, []) if d >= pd.Timestamp(start)][: n + 1]
    rows = []
    for d in future:
        try:
            r = _lidx.loc[(code, d)]
        except KeyError:
            continue
        def _f(col):
            v = r.get(col, float("nan")) if hasattr(r, "get") else getattr(r, col, float("nan"))
            return float(v) if pd.notna(v) else None
        rows.append({
            "trade_date": d,
            "open":  float(r["open_price"]),
            "high":  float(r["high_price"]),
            "low":   float(r["low_price"]),
            "close": float(r["close_price"]),
            "ma20":  _f("ma20"),
        })
    return pd.DataFrame(rows) if rows else None


def simulate_cond_ext(prices, stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                      base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20):
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry, peak, extended = float(prices.iloc[0]["open"]), float(prices.iloc[0]["open"]), False
    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo, hi, close = float(row["low"]), float(row["high"]), float(row["close"])
        low_ret = (lo - entry) / entry
        if i < efd and low_ret <= ef:
            return row["trade_date"], ef - base.COST, "EARLY_FAIL"
        if low_ret <= stop:
            return row["trade_date"], stop - base.COST, "STOP"
        peak = max(peak, hi)
        if (peak - entry) / entry >= ts and (close - peak) / peak <= -tp:
            return row["trade_date"], (close - entry) / entry - base.COST, "TRAIL"
        if not extended and i >= base_mh - 1:
            ma20 = row.get("ma20")
            if ma20 is not None and close > ma20 and (close - entry) / entry >= extend_ret:
                extended = True
                continue
            return row["trade_date"], (close - entry) / entry - base.COST, "MAX"
        if extended and extension_tp is not None and (close - peak) / peak <= -extension_tp:
            return row["trade_date"], (close - entry) / entry - base.COST, "EXT_TRAIL"
        if i >= mh - 1:
            return row["trade_date"], (close - entry) / entry - base.COST, "MAX"
    last = prices.iloc[-1]
    return last["trade_date"], (float(last["close"]) - entry) / entry - base.COST, "MAX"


def run_bt(label, regime_str, delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65,
           entry_shadow=0.08, entry_body=0.0, entry_ma20_min=0.05,
           entry_next_body_min=0.01, cadence_days=5,
           stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
           base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20):
    sig_dates = sorted(base.candidates["trade_date"].unique())
    cadence, prev = [], None
    for d in sig_dates:
        idx = base.date_to_idx.get(d)
        if idx is None:
            continue
        if prev is None or idx - prev >= cadence_days:
            cadence.append(d)
            prev = idx

    trades, month_pnl, open_until = [], {}, None
    for sd in cadence:
        sp = pd.Timestamp(sd)
        ym = (sp.year, sp.month)
        if month_pnl.get(ym, 0) <= -0.15:
            continue
        if open_until is not None and sp <= open_until:
            continue
        if not pass_ext_regime(sp, regime_str):
            continue

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(top_n))
        selected = None
        for _, cand in day_cands.iterrows():
            code = cand["asset_code"]
            ecd = base.get_nth_day(code, sp, delay)
            if ecd is None:
                continue
            try:
                er = base.df_indexed.loc[(code, ecd)]
            except KeyError:
                continue
            sig_close = float(cand["close_price"])
            ent_close = float(er["close_price"])
            if (ent_close - sig_close) / sig_close < entry_drawdown:
                continue
            if float(er["candle_loc"])   < entry_loc:
                continue
            if float(er["upper_shadow"]) > entry_shadow:
                continue
            if float(er["body_ret"])     < entry_body:
                continue
            if entry_ma20_min is not None:
                if (ent_close - float(er["ma20"])) / float(er["ma20"]) < entry_ma20_min:
                    continue
            nxt = base.get_nth_day(code, ecd, 1)
            if nxt is None:
                continue
            if entry_next_body_min is not None:
                try:
                    nr = base.df_indexed.loc[(code, nxt)]
                    if float(nr["body_ret"]) < entry_next_body_min:
                        continue
                except KeyError:
                    continue
            selected = (cand, ecd, nxt)
            break

        if selected is None:
            continue
        cand, ecd, exday = selected
        future = get_future_rows(cand["asset_code"], exday, mh + 1)
        exit_day, ret, reason = simulate_cond_ext(
            future, stop=stop, ef=ef, efd=efd, ts=ts, tp=tp,
            base_mh=base_mh, extend_ret=extend_ret, mh=mh, extension_tp=extension_tp)
        if exit_day is None:
            continue
        exit_m = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_m] = month_pnl.get(exit_m, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = ("pre"   if sp <= pd.Timestamp(base.PRE_END)
                  else ("train" if sp <= pd.Timestamp(base.TRAIN_END) else "post"))
        trades.append({
            "variant":     label,
            "period":      period,
            "signal_date": sd,
            "asset_code":  cand["asset_code"],
            "asset_name":  cand["asset_name"],
            "entry_date":  exday,
            "exit_date":   exit_day,
            "ret":         ret,
            "reason":      reason,
            "kospi_ret5":  kospi_ret5_map.get(sp),
            "kosdaq_slope": kosdaq_slope5_map.get(sp),
        })
    return pd.DataFrame(trades)


def metric(trades, start, end):
    if len(trades) == 0:
        return None
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start)) &
        (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ].copy()
    if len(s) == 0:
        return None
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly = s.groupby("ym")["ret"].sum()
    return {
        "avg":   monthly.mean(),
        "total": (1 + s["ret"]).prod() - 1,
        "worst": monthly.min(),
        "n":     len(s),
        "win":   (s["ret"] > 0).mean(),
        "early": int(s["reason"].str.contains("EARLY_FAIL").sum()),
    }


def year_breakdown(trades, start, end):
    if len(trades) == 0:
        return {}
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start)) &
        (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ].copy()
    if len(s) == 0:
        return {}
    s["year"] = pd.to_datetime(s["exit_date"]).dt.year
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    result = {}
    for yr, grp in s.groupby("year"):
        monthly = grp.groupby("ym")["ret"].sum()
        result[yr] = {
            "avg": monthly.mean(),
            "total": (1 + grp["ret"]).prod() - 1,
            "n": len(grp),
            "win": (grp["ret"] > 0).mean(),
        }
    return result


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


# ── variant grid ──────────────────────────────────────────────────────────────
# regime_str format: "base_regime[+gate1[+gate2]]"
# base_regime: any key supported by base.pass_regime
# gates: kospi_ret5, kosdaq_slope, kospi_slope, kosdaq_ret5

EXIT = dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
            base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20)
ENTRY = dict(delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.08,
             entry_body=0.0, entry_ma20_min=0.05, entry_next_body_min=0.01, cadence_days=5)

VARIANTS = [
    # references
    ("ref_bma20",           "both_ma20",                            {**ENTRY, **EXIT}),
    ("ref_Kma60",           "KOSPI_ma60",                           {**ENTRY, **EXIT}),
    # intermediate: KOSPI_ma20 only (no KOSDAQ constraint)
    ("Kma20_only",          "KOSPI_ma20",                           {**ENTRY, **EXIT}),
    # both_ma20 + momentum gates
    ("bma20+Kret5",         "both_ma20+kospi_ret5",                 {**ENTRY, **EXIT}),
    ("bma20+Qslope",        "both_ma20+kosdaq_slope",               {**ENTRY, **EXIT}),
    ("bma20+Kret5+Qslope",  "both_ma20+kospi_ret5+kosdaq_slope",    {**ENTRY, **EXIT}),
    # KOSPI_ma20 + slope
    ("Kma20+Qslope",        "KOSPI_ma20+kosdaq_slope",              {**ENTRY, **EXIT}),
    # both_ma20 + both momentum
    ("bma20+Kret5+Qret5",   "both_ma20+kospi_ret5+kosdaq_ret5",    {**ENTRY, **EXIT}),
    # both_ma20 + KOSPI slope
    ("bma20+Kslope",        "both_ma20+kospi_slope",                {**ENTRY, **EXIT}),
    # combined aggressive
    ("bma20+Kslope+Qslope", "both_ma20+kospi_slope+kosdaq_slope",   {**ENTRY, **EXIT}),
]


def main():
    rows, frames, ranks, top_for_yearly = [], [], [], []

    for label, regime_str, params in VARIANTS:
        print(f"  {label}  [{regime_str}]...", flush=True)
        trades = run_bt(label, regime_str, **params)
        frames.append(trades)

        m_all = {}
        for name, start, end in PERIODS:
            m = metric(trades, start, end) if len(trades) > 0 else None
            m_all[name] = m
            rows.append([
                label, name,
                m["avg"]   if m else None,
                m["total"] if m else None,
                m["worst"] if m else None,
                m["n"]     if m else 0,
                m["win"]   if m else None,
                m["early"] if m else 0,
            ])

        pre   = m_all.get("pre")
        train = m_all.get("train")
        post  = m_all.get("post")
        if pre and train:
            pass_all = (
                pre["avg"]     > 0 and
                train["avg"]   >= 0.40 and
                train["worst"] >= -0.15 and
                train["win"]   >= 0.70 and
                (post is None or post["avg"] >= 0)
            )
            score = (train["avg"] + train["win"] * 0.20
                     + min(pre["avg"], 0.20) + train["worst"])
            if post and post["avg"] < 0:
                score -= 0.05
            ranks.append((label, pass_all, score, pre, train, post))
            if pass_all or label.startswith("ref"):
                top_for_yearly.append((label, trades))

    # ── trades CSV ──────────────────────────────────────────────────────────
    out_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    trades_path = ".Codex/reports/2026-05-26_w4-regime-filter-trades.csv"
    out_trades.to_csv(trades_path, index=False, encoding="utf-8-sig")

    ranks.sort(key=lambda x: (x[1], x[2]), reverse=True)

    # ── report ──────────────────────────────────────────────────────────────
    lines = [
        "# W4 Regime Filter Grid\n\n",
        "date: 2026-05-26\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass | score | pre avg | train avg | train worst | train win | post avg | N train | N post |\n",
        "|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, pass_all, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {'Y' if pass_all else 'N'} | {score:.4f} | "
            f"{pct(pre['avg'])} | {pct(train['avg'])} | {pct(train['worst'])} | "
            f"{pct(train['win'])} | {pct(post['avg'] if post else None)} | "
            f"{train['n']} | {post['n'] if post else 0} |\n"
        )

    lines += [
        "\n## Full Result\n\n",
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

    # ── year-by-year for references + passing variants ───────────────────
    if top_for_yearly:
        lines.append("\n## Year-by-Year (references + passing variants)\n\n")
        all_years = sorted({
            pd.Timestamp(sd).year
            for _, t in top_for_yearly
            for sd in (t["signal_date"].tolist() if len(t) > 0 else [])
        })
        hdr_years = " | ".join(str(y) for y in all_years)
        lines.append(f"| variant | period | {hdr_years} |\n")
        lines.append(f"|---|---| {'|'.join(['---'] * len(all_years))} |\n")
        for label, trades in top_for_yearly:
            for period, start, end in PERIODS:
                yb = year_breakdown(trades, start, end)
                cells = " | ".join(pct(yb[y]["avg"]) if y in yb else "-" for y in all_years)
                lines.append(f"| {label} | {period} | {cells} |\n")

    lines += [
        "\n## Readout\n\n",
        "- ref_bma20: both_ma20, train 46.09%, post -2.90% (2 trades).\n",
        "- ref_Kma60: KOSPI_ma60, train 32.59%, post +5.35% (3 trades).\n",
        "- Momentum gates added: kospi_ret5 (KOSPI 5d return), kosdaq_slope (KOSDAQ MA20 slope/5d).\n",
        "- Pass criteria: pre>0%, train>=40%, worst>=-15%, win>=70%, post>=0%.\n",
        "- Year-by-year shown for references and passing variants only.\n",
        f"- Trades: `{trades_path}`\n",
    ]

    report_path = ".Codex/reports/2026-05-26_w4-regime-filter.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {report_path}")


if __name__ == "__main__":
    main()
