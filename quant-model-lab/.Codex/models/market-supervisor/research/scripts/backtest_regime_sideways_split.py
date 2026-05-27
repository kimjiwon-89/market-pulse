"""SIDEWAYS 내부 분류 테스트.

SIDEWAYS를 slope + breadth 기준으로 3개로 쪼갬:
  SIDEWAYS_UP   : 상승 초입 (slope>0, breadth>0.5)
  SIDEWAYS_DOWN : 하락 초입 (slope<0, breadth<0.5)
  SIDEWAYS_FLAT : 나머지

각 sub-regime별 성과 비교.
policy: BEAR/CRASH 차단, SIDEWAYS_UP=full, SIDEWAYS_FLAT=strict, SIDEWAYS_DOWN=차단

Writes:
  .Codex/reports/2026-05-27_regime-sideways-split.md
  .Codex/reports/2026-05-27_regime-sideways-split-trades.csv
"""
import os
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd
import market_regime_model as mrm
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_regime-sideways-split.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_regime-sideways-split-trades.csv"

base      = post_grid.prev.base
COMMON    = post_grid.prev.COMMON_ENTRY
BEST_EXIT = post_grid.EXIT_VARIANTS[1][1]

PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]


def classify_sideways(features: dict) -> str:
    """SIDEWAYS를 세 가지로 세분화."""
    slope_up  = (features.get("kospi_ma20_slope", 0) > 0 and
                 features.get("kosdaq_ma20_slope", 0) > 0)
    slope_dn  = (features.get("kospi_ma20_slope", 0) < 0 and
                 features.get("kosdaq_ma20_slope", 0) < 0)
    breadth_up = features.get("breadth_ma20", 0.5) > 0.50
    breadth_dn = features.get("breadth_ma20", 0.5) < 0.45
    adv_up     = features.get("advance_ratio_5d", 0.5) > 0.50

    if slope_up and breadth_up:
        return "SIDEWAYS_UP"
    if slope_dn and breadth_dn:
        return "SIDEWAYS_DOWN"
    return "SIDEWAYS_FLAT"


def regime_for(signal_date) -> str:
    features = regime_base.regime_features(signal_date)
    regime   = mrm.classify_regime(features)
    if regime == "SIDEWAYS":
        return classify_sideways(features)
    return regime


# Policy grid: 어떤 sub-regime 허용할지 4가지 조합 테스트
POLICIES = {
    "baseline_strict":   {"BULL": True, "SIDEWAYS_UP": True,  "SIDEWAYS_FLAT": True,  "SIDEWAYS_DOWN": False, "BEAR": False, "CRASH": False},
    "up_only":           {"BULL": True, "SIDEWAYS_UP": True,  "SIDEWAYS_FLAT": False, "SIDEWAYS_DOWN": False, "BEAR": False, "CRASH": False},
    "up_and_flat":       {"BULL": True, "SIDEWAYS_UP": True,  "SIDEWAYS_FLAT": True,  "SIDEWAYS_DOWN": False, "BEAR": False, "CRASH": False},
    "bull_only":         {"BULL": True, "SIDEWAYS_UP": False, "SIDEWAYS_FLAT": False, "SIDEWAYS_DOWN": False, "BEAR": False, "CRASH": False},
}

# SIDEWAYS_UP: 완화 진입, SIDEWAYS_FLAT: 엄격 진입
ENTRY_BY_REGIME = {
    "BULL":          {"nb_min": COMMON["entry_next_body_min"], "ma_min": COMMON["entry_ma20_min"]},
    "SIDEWAYS_UP":   {"nb_min": 0.01,  "ma_min": 0.05},
    "SIDEWAYS_FLAT": {"nb_min": 0.02,  "ma_min": 0.08},
    "SIDEWAYS_DOWN": {"nb_min": 0.03,  "ma_min": 0.10},
}


def run_bt(policy_name, policy):
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

        regime = regime_for(sp)
        if not policy.get(regime, False):
            continue

        entry_cfg = ENTRY_BY_REGIME.get(regime, ENTRY_BY_REGIME["BULL"])
        nb_min, ma_min = entry_cfg["nb_min"], entry_cfg["ma_min"]

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
            if float(er["candle_loc"])   < COMMON["entry_loc"]:    continue
            if float(er["upper_shadow"]) > COMMON["entry_shadow"]: continue
            if float(er["body_ret"])     < COMMON["entry_body"]:   continue
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
            "policy": policy_name, "period": period, "regime": regime,
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
    frames, summary = [], []

    for policy_name, policy in POLICIES.items():
        print(f"  {policy_name}...", flush=True)
        t = run_bt(policy_name, policy)
        if len(t):
            frames.append(t)

        m = {p: metric(t, s, e) if len(t) else None for p, s, e in PERIODS}
        ok = passes(m["pre"], m["train"], m["post"])

        summary.append({
            "policy": policy_name, "pass": "Y" if ok else "N",
            "pre_avg":     m["pre"]["avg"]     if m["pre"]   else None,
            "train_avg":   m["train"]["avg"]   if m["train"] else None,
            "train_worst": m["train"]["worst"] if m["train"] else None,
            "train_win":   m["train"]["win"]   if m["train"] else None,
            "train_n":     m["train"]["n"]     if m["train"] else 0,
            "post_avg":    m["post"]["avg"]    if m["post"]  else None,
            "post_n":      m["post"]["n"]      if m["post"]  else 0,
        })

    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    summary.sort(key=lambda r: (r["train_avg"] or -99), reverse=True)

    lines = [
        "# Regime SIDEWAYS Split Test\n\n",
        f"date: {REPORT_DATE}\n\n",
        "SIDEWAYS 세분화 기준:\n",
        "  SIDEWAYS_UP   : KOSPI+KOSDAQ MA20 slope 모두 양수 AND breadth_ma20 > 0.50\n",
        "  SIDEWAYS_DOWN : KOSPI+KOSDAQ MA20 slope 모두 음수 AND breadth_ma20 < 0.45\n",
        "  SIDEWAYS_FLAT : 나머지\n\n",
        "진입 조건:\n",
        "  BULL         : 기존 entry_ma20_min\n",
        "  SIDEWAYS_UP  : entry_next_body_min=0.01, entry_ma20_min=0.05 (완화)\n",
        "  SIDEWAYS_FLAT: entry_next_body_min=0.02, entry_ma20_min=0.08 (엄격)\n\n",
        "## Results\n\n",
        "| policy | pass | pre avg | train avg | train worst | train win | train N | post avg | post N |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for r in summary:
        lines.append(
            f"| {r['policy']} | {r['pass']} | {pct(r['pre_avg'])} | "
            f"{pct(r['train_avg'])} | {pct(r['train_worst'])} | "
            f"{pct(r['train_win'])} | {r['train_n']} | "
            f"{pct(r['post_avg'])} | {r['post_n']} |\n"
        )

    # Regime breakdown for baseline
    if len(all_trades):
        lines += [
            "\n## SIDEWAYS Sub-regime Breakdown (train, baseline_strict)\n\n",
            "| regime | avg ret | N | win |\n",
            "|---|---:|---:|---:|\n",
        ]
        bt = all_trades[all_trades["policy"] == "baseline_strict"]
        bt_train = bt[
            (pd.to_datetime(bt["signal_date"]) >= pd.Timestamp(base.TRAIN_START)) &
            (pd.to_datetime(bt["signal_date"]) <= pd.Timestamp(base.TRAIN_END))
        ]
        for r in ["BULL", "SIDEWAYS_UP", "SIDEWAYS_FLAT", "SIDEWAYS_DOWN"]:
            g = bt_train[bt_train["regime"] == r]
            if len(g) == 0:
                continue
            lines.append(f"| {r} | {pct(g['ret'].mean())} | {len(g)} | {pct((g['ret']>0).mean())} |\n")

    lines += [
        "\n## Notes\n\n",
        "- SIDEWAYS_UP이 좋으면: BULL 정의를 완화할 여지 있음.\n",
        "- SIDEWAYS_DOWN이 나쁘면: slope 음전환 시 차단이 효과적.\n",
        "- SIDEWAYS_FLAT이 불안정하면: FLAT 차단이 안전.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")

    print(f"\n{'policy':25} {'pass':4} {'train_avg':>10} {'worst':>8} {'win':>6} {'N':>4}")
    for r in summary:
        print(f"{r['policy']:25} {r['pass']:4} "
              f"{pct(r['train_avg']):>10} {pct(r['train_worst']):>8} "
              f"{pct(r['train_win']):>6} {r['train_n']:>4}")


if __name__ == "__main__":
    main()
