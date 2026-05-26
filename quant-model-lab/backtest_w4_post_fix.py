"""
backtest_w4_post_fix.py

Problem : cond_ext60_ret25_t20  train 46.09%, post -2.90% (2 trades, 1 early-fail).
Goal    : find variants that keep train >=40% while making post positive.

Grid
  A  regime x extend_ret  [3 x 3 = 9]
  B  extension_tp          [3  vs baseline]
  C  entry delay           [2  vs baseline]
  D  top_n                 [2  vs baseline]
  E  entry_loc             [1  vs baseline]
Total 17 variants.

Writes
  .Codex/reports/2026-05-26_w4-post-fix.md
  .Codex/reports/2026-05-26_w4-post-fix-trades.csv
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
    """Hold base_mh days; if ret>=extend_ret and price>MA20, extend to mh with extension_tp trail."""
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry    = float(prices.iloc[0]["open"])
    peak     = entry
    extended = False
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


def run_bt(label, delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65,
           entry_shadow=0.08, entry_body=0.0, entry_ma20_min=0.05,
           entry_next_body_min=0.01, cadence_days=5, regime="both_ma20",
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
        if not base.pass_regime(sp, regime):
            continue

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(top_n))
        selected = None
        for _, cand in day_cands.iterrows():
            code = cand["asset_code"]
            ecd  = base.get_nth_day(code, sp, delay)
            if ecd is None:
                continue
            try:
                er = base.df_indexed.loc[(code, ecd)]
            except KeyError:
                continue
            sig_close  = float(cand["close_price"])
            ent_close  = float(er["close_price"])
            if (ent_close - sig_close) / sig_close < entry_drawdown:
                continue
            if float(er["candle_loc"])    < entry_loc:
                continue
            if float(er["upper_shadow"])  > entry_shadow:
                continue
            if float(er["body_ret"])      < entry_body:
                continue
            if entry_ma20_min is not None:
                ma20 = float(er["ma20"])
                if (ent_close - ma20) / ma20 < entry_ma20_min:
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
        future   = get_future_rows(cand["asset_code"], exday, mh + 1)
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
            "variant":    label,
            "period":     period,
            "signal_date": sd,
            "asset_code": cand["asset_code"],
            "asset_name": cand["asset_name"],
            "entry_date": exday,
            "exit_date":  exit_day,
            "ret":        ret,
            "reason":     reason,
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


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


# ── variant grid ──────────────────────────────────────────────────────────────
BASE = dict(
    delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.08,
    entry_body=0.0, entry_ma20_min=0.05, entry_next_body_min=0.01,
    cadence_days=5, stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
    base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20,
)

VARIANTS = []

# A  regime x extend_ret
for _regime in ["both_ma20", "KOSPI_ma60", "both_ma60"]:
    for _ext in [0.20, 0.25, 0.30]:
        _rtag = _regime.replace("both_ma", "bma").replace("KOSPI_ma", "Kma")
        VARIANTS.append((f"{_rtag}_ext{int(_ext * 100)}", {**BASE, "regime": _regime, "extend_ret": _ext}))

# B  extension_tp
for _tp in [0.12, 0.15, 0.25]:
    VARIANTS.append((f"bma20_ext25_tp{int(_tp * 100)}", {**BASE, "extension_tp": _tp}))

# C  entry delay
for _d in [3, 7]:
    VARIANTS.append((f"bma20_delay{_d}", {**BASE, "delay": _d}))

# D  top_n
for _n in [5, 15]:
    VARIANTS.append((f"bma20_top{_n}", {**BASE, "top_n": _n}))

# E  entry_loc
VARIANTS.append(("bma20_loc55", {**BASE, "entry_loc": 0.55}))


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    rows, frames, ranks = [], [], []

    for label, params in VARIANTS:
        print(f"  {label}...", flush=True)
        trades = run_bt(label, **params)
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
                pre["avg"]   > 0 and
                train["avg"] >= 0.40 and
                train["worst"] >= -0.15 and
                train["win"]  >= 0.70 and
                (post is None or post["avg"] >= 0)
            )
            score = (train["avg"] + train["win"] * 0.20
                     + min(pre["avg"], 0.20) + train["worst"])
            if post and post["avg"] < 0:
                score -= 0.05
            ranks.append((label, pass_all, score, pre, train, post))

    out_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    trades_path = ".Codex/reports/2026-05-26_w4-post-fix-trades.csv"
    out_trades.to_csv(trades_path, index=False, encoding="utf-8-sig")

    ranks.sort(key=lambda x: (x[1], x[2]), reverse=True)

    lines = [
        "# W4 Post-Fix Grid\n\n",
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

    lines += [
        "\n## Readout\n\n",
        "- Baseline (bma20_ext25): train 46.09%, post -2.90% (2 trades, 1 early-fail).\n",
        "- Pass criteria: pre>0%, train>=40%, worst>=-15%, win>=70%, post>=0%.\n",
        "- Group A: regime tightening — main lever to fix post.\n",
        "- Group B: extension_tp tuning on baseline.\n",
        "- Groups C-E: entry parameter sensitivity.\n",
        f"- Trades: `{trades_path}`\n",
    ]

    report_path = ".Codex/reports/2026-05-26_w4-post-fix.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {report_path}")


if __name__ == "__main__":
    main()
