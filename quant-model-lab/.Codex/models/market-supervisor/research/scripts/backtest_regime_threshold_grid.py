"""Regime threshold grid search.

bull_score_min x bear_score_min 조합 테스트.
policy: router_strict_sideways (이전 테스트 1위).

Writes:
  .Codex/reports/2026-05-27_regime-threshold-grid.md
  .Codex/reports/2026-05-27_regime-threshold-grid-trades.csv
"""
import os
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd
import market_regime_model as mrm
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_regime-threshold-grid.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_regime-threshold-grid-trades.csv"

base   = post_grid.prev.base
COMMON = post_grid.prev.COMMON_ENTRY
BEST_EXIT = post_grid.EXIT_VARIANTS[1][1]

BULL_MINS = [5, 6, 7, 8]
BEAR_MINS = [3, 4, 5, 6]

STRICT_SIDEWAYS = {"entry_next_body_min": 0.02, "entry_ma20_min": 0.08}

PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]


def regime_for(signal_date, bull_min, bear_min):
    features = regime_base.regime_features(signal_date)
    # Temporarily patch thresholds
    orig_b, orig_r = mrm.BULL_SCORE_MIN, mrm.BEAR_SCORE_MIN
    mrm.BULL_SCORE_MIN = bull_min
    mrm.BEAR_SCORE_MIN = bear_min
    result = mrm.classify_regime(features)
    mrm.BULL_SCORE_MIN = orig_b
    mrm.BEAR_SCORE_MIN = orig_r
    return result


def run_bt(bull_min, bear_min):
    sig_dates = sorted(base.candidates["trade_date"].unique())
    cadence, prev_idx = [], None
    for d in sig_dates:
        idx = base.date_to_idx.get(d)
        if idx is None:
            continue
        if prev_idx is None or idx - prev_idx >= COMMON["cadence_days"]:
            cadence.append(d)
            prev_idx = idx

    trades, month_pnl, open_until = [], {}, None
    for sd in cadence:
        sp = pd.Timestamp(sd)
        ym = (sp.year, sp.month)
        if month_pnl.get(ym, 0) <= -0.15:
            continue
        if open_until is not None and sp <= open_until:
            continue
        if not base.pass_regime(sp, COMMON["regime"]):
            continue

        regime = regime_for(sp, bull_min, bear_min)

        if regime in ("BEAR", "CRASH"):
            continue

        # SIDEWAYS: strict entry conditions
        nb_min = STRICT_SIDEWAYS["entry_next_body_min"] if regime == "SIDEWAYS" else COMMON["entry_next_body_min"]
        ma_min = STRICT_SIDEWAYS["entry_ma20_min"]      if regime == "SIDEWAYS" else COMMON["entry_ma20_min"]

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(COMMON["top_n"]))
        selected = None
        for _, cand in day_cands.iterrows():
            code = cand["asset_code"]
            ecd  = base.get_nth_day(code, sp, COMMON["delay"])
            if ecd is None:
                continue
            try:
                er = base.df_indexed.loc[(code, ecd)]
            except KeyError:
                continue
            if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < COMMON["entry_drawdown"]:
                continue
            if float(er["candle_loc"])    < COMMON["entry_loc"]:    continue
            if float(er["upper_shadow"])  > COMMON["entry_shadow"]: continue
            if float(er["body_ret"])      < COMMON["entry_body"]:   continue
            if (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"]) < ma_min:
                continue
            nxt = base.get_nth_day(code, ecd, 1)
            if nxt is None:
                continue
            try:
                nr = base.df_indexed.loc[(code, nxt)]
                if float(nr["body_ret"]) < nb_min:
                    continue
            except KeyError:
                continue
            selected = (cand, ecd, nxt)
            break

        if selected is None:
            continue

        cand, ecd, exday = selected
        params = {"stop": -0.12, "ef": -0.06, "efd": 3, **BEST_EXIT}
        future = post_grid.prev.get_future_rows(cand["asset_code"], exday, params.get("mh", 30) + 1)
        exit_day, ret, reason = post_grid.simulate_exit(future, **params)
        if exit_day is None:
            continue

        exit_m = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_m] = month_pnl.get(exit_m, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = ("pre" if sp <= pd.Timestamp(base.PRE_END)
                  else ("train" if sp <= pd.Timestamp(base.TRAIN_END) else "post"))
        trades.append({
            "bull_min": bull_min, "bear_min": bear_min,
            "period": period, "regime": regime,
            "signal_date": sd, "asset_code": cand["asset_code"],
            "asset_name": cand["asset_name"],
            "entry_date": exday, "exit_date": exit_day,
            "ret": ret, "reason": reason,
        })
    return pd.DataFrame(trades)


def metric(trades, start, end):
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start)) &
        (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ]
    if len(s) == 0:
        return None
    s = s.copy()
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly = s.groupby("ym")["ret"].sum()
    return {
        "avg":   monthly.mean(),
        "worst": monthly.min(),
        "n":     len(s),
        "win":   (s["ret"] > 0).mean(),
        "total": (1 + s["ret"]).prod() - 1,
    }


def pct(v):
    return "-" if v is None else f"{v*100:.2f}%"


def passes(pre, train, post):
    if not pre or not train:
        return False
    return (pre["avg"] > 0 and train["avg"] >= 0.40
            and train["worst"] >= -0.13 and train["win"] >= 0.70
            and (post is None or post["avg"] >= 0))


def main():
    frames, rows = [], []

    for bull_min in BULL_MINS:
        for bear_min in BEAR_MINS:
            label = f"B{bull_min}_b{bear_min}"
            print(f"  {label}...", flush=True)
            t = run_bt(bull_min, bear_min)
            if len(t):
                frames.append(t)

            m = {p: metric(t, s, e) if len(t) else None for p, s, e in PERIODS}
            ok = passes(m["pre"], m["train"], m["post"])

            rows.append({
                "label": label, "bull_min": bull_min, "bear_min": bear_min,
                "pass": "Y" if ok else "N",
                "pre_avg":     m["pre"]["avg"]     if m["pre"]   else None,
                "train_avg":   m["train"]["avg"]   if m["train"] else None,
                "train_worst": m["train"]["worst"] if m["train"] else None,
                "train_win":   m["train"]["win"]   if m["train"] else None,
                "train_n":     m["train"]["n"]     if m["train"] else 0,
                "post_avg":    m["post"]["avg"]    if m["post"]  else None,
                "post_n":      m["post"]["n"]      if m["post"]  else 0,
            })

    # Save trades
    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    # Sort by train_avg desc
    rows.sort(key=lambda r: (r["train_avg"] or -99), reverse=True)

    # Report
    lines = [
        "# Regime Threshold Grid\n\n",
        f"date: {REPORT_DATE}\n",
        "policy: router_strict_sideways (BEAR/CRASH 차단, SIDEWAYS 엄격 진입)\n",
        f"bull_min grid: {BULL_MINS}\n",
        f"bear_min grid: {BEAR_MINS}\n\n",
        "promo: pre>0%, train>=40%, worst>=-13%, win>=70%, post>=0%\n\n",
        "## Results\n\n",
        "| label | bull_min | bear_min | pass | pre avg | train avg | train worst | train win | train N | post avg | post N |\n",
        "|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for r in rows:
        lines.append(
            f"| {r['label']} | {r['bull_min']} | {r['bear_min']} | {r['pass']} | "
            f"{pct(r['pre_avg'])} | {pct(r['train_avg'])} | {pct(r['train_worst'])} | "
            f"{pct(r['train_win'])} | {r['train_n']} | {pct(r['post_avg'])} | {r['post_n']} |\n"
        )

    # Heatmap: train_avg by (bull_min, bear_min)
    lines += ["\n## Train Avg Heatmap\n\n",
              "| bull_min \\ bear_min |" + "".join(f" {b} |" for b in BEAR_MINS) + "\n",
              "|---:|" + "---:|" * len(BEAR_MINS) + "\n"]
    for bull_min in BULL_MINS:
        cells = []
        for bear_min in BEAR_MINS:
            r = next((x for x in rows if x["bull_min"] == bull_min and x["bear_min"] == bear_min), None)
            v = pct(r["train_avg"]) if r else "-"
            cells.append(v)
        lines.append(f"| {bull_min} |" + "".join(f" {c} |" for c in cells) + "\n")

    lines += [
        "\n## Notes\n\n",
        "- 현재 기본값: bull_min=7, bear_min=5.\n",
        "- 여러 조합에서 일관되게 좋으면 모델 신뢰도 높음.\n",
        "- 특정 조합에서만 좋으면 과적합 의심.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")

    # Quick print
    print(f"\n{'label':16} {'pass':4} {'train_avg':>10} {'worst':>8} {'win':>6} {'N':>4}")
    for r in rows[:8]:
        print(f"{r['label']:16} {r['pass']:4} "
              f"{pct(r['train_avg']):>10} {pct(r['train_worst']):>8} "
              f"{pct(r['train_win']):>6} {r['train_n']:>4}")


if __name__ == "__main__":
    main()
