"""KOSPI/KOSDAQ 분리 레짐 임계값 grid search.

개선사항:
  1. KOSPI/KOSDAQ 별도 breadth 집계 (기존: 전체 시장 breadth 사용)
  2. per-index bull_min / bear_min grid search

Grid:
  single_bull_min = [3, 4, 5, 6]
  single_bear_min = [3, 4, 5]
  -> 12 combinations

비교 기준: baseline(통합 레짐) train avg 53.59%

Writes:
  .Codex/reports/2026-05-27_regime-split-threshold-grid.md
  .Codex/reports/2026-05-27_regime-split-threshold-grid-trades.csv
"""
import os
import sys
os.environ.setdefault("W4_PRE_START", "2012-01-01")
_root    = os.path.dirname(os.path.abspath(__file__))
_scripts = os.path.join(_root, ".Codex", "models", "bull-v4", "scripts")
_legacy  = os.path.join(_scripts, "legacy-root")
_mrm     = os.path.join(_root, ".Codex", "models", "market-supervisor", "research", "scripts")
for p in [_root, _scripts, _legacy, _mrm]:
    if p not in sys.path:
        sys.path.insert(0, p)

import psycopg2
import pandas as pd
import market_regime_model as mrm
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_regime-split-threshold-grid.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_regime-split-threshold-grid-trades.csv"

DB = dict(host="localhost", port=5432, dbname="marketpulse",
          user="postgres", password="postgreskh")

base      = post_grid.prev.base
COMMON    = post_grid.prev.COMMON_ENTRY
BEST_EXIT = post_grid.EXIT_VARIANTS[1][1]

PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]

STRICT = {"nb_min": 0.02, "ma_min": 0.08}
RELAX  = {"nb_min": COMMON["entry_next_body_min"], "ma_min": COMMON["entry_ma20_min"]}

BULL_MINS = [3, 4, 5, 6]
BEAR_MINS = [3, 4, 5]


# ── Exchange map + separate breadth ──────────────────────────────────────────

def build_exchange_map() -> dict[str, str]:
    conn = psycopg2.connect(**DB)
    try:
        df = pd.read_sql(
            "SELECT DISTINCT asset_code, sector FROM market_daily_price "
            "WHERE asset_type='STOCK' AND close_price > 0",
            conn,
        )
    finally:
        conn.close()
    return {row["asset_code"]: ("KOSPI" if row["sector"] == "KOSPI" else "KOSDAQ")
            for _, row in df.iterrows()}


def build_separate_breadth(exchange_map: dict) -> pd.DataFrame:
    """Compute KOSPI-only and KOSDAQ-only breadth from base.df."""
    stocks = regime_base.STOCKS.copy()
    stocks["exchange"] = stocks["asset_code"].map(exchange_map).fillna("KOSDAQ")

    def _breadth(group):
        g = group.groupby("trade_date")
        return pd.DataFrame({
            "breadth_ma20":    g["above_ma20"].mean(),
            "advance_ratio_5d": g["ret5"].apply(lambda s: (s > 0).mean()),
        })

    kospi_br  = _breadth(stocks[stocks["exchange"] == "KOSPI"])
    kosdaq_br = _breadth(stocks[stocks["exchange"] == "KOSDAQ"])
    return kospi_br, kosdaq_br


# ── Per-index regime with tunable thresholds + separate breadth ───────────────

def _classify_single_tuned(above_ma20, above_ma60, slope, vol,
                            breadth_proxy, liq, bull_min, bear_min):
    if breadth_proxy <= mrm.CRASH_BREADTH_MAX and vol >= mrm.CRASH_VOL_MIN and not above_ma60:
        return "CRASH"
    bull = int(sum([above_ma20, above_ma60, slope > 0,
                    breadth_proxy >= 0.55, vol <= mrm.VOL_NORMAL_MAX, liq >= 0]))
    bear = int(sum([not above_ma60, slope < 0,
                    breadth_proxy <= 0.35, vol >= mrm.VOL_ELEVATED, liq < 0]))
    if bull >= bull_min:
        return "BULL"
    if bear >= bear_min:
        return "BEAR"
    return "SIDEWAYS"


def regime_pair_tuned(signal_date, kospi_br, kosdaq_br,
                      bull_min: int, bear_min: int) -> tuple[str, str]:
    d = pd.Timestamp(signal_date)
    features = regime_base.regime_features(signal_date)

    # KOSPI breadth from KOSPI-only stocks
    try:
        kbr = float(kospi_br.loc[d, "breadth_ma20"])
        kadv = float(kospi_br.loc[d, "advance_ratio_5d"])
    except KeyError:
        kbr, kadv = features["breadth_ma20"], features["advance_ratio_5d"]

    # KOSDAQ breadth from KOSDAQ-only stocks
    try:
        dbr = float(kosdaq_br.loc[d, "breadth_ma20"])
        dadv = float(kosdaq_br.loc[d, "advance_ratio_5d"])
    except KeyError:
        dbr, dadv = features["advance_ratio_5d"], features["advance_ratio_5d"]

    vol_k = float(regime_base.KOSPI.loc[d, "vol20"]) if d in regime_base.KOSPI.index else features["volatility_20"]
    vol_d = float(regime_base.KOSDAQ.loc[d, "vol20"]) if d in regime_base.KOSDAQ.index else features["volatility_20"]
    liq   = features["liquidity_trend"]

    kospi_r = _classify_single_tuned(
        features["kospi_above_ma20"], features["kospi_above_ma60"],
        features["kospi_ma20_slope"], vol_k, kbr, liq, bull_min, bear_min)

    kosdaq_r = _classify_single_tuned(
        features["kosdaq_above_ma20"], features["kosdaq_above_ma60"],
        features["kosdaq_ma20_slope"], vol_d, dadv, liq, bull_min, bear_min)

    return kospi_r, kosdaq_r


# ── Backtest runner ───────────────────────────────────────────────────────────

def run_bt(bull_min: int, bear_min: int,
           exchange_map: dict, kospi_br, kosdaq_br) -> pd.DataFrame:
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

        kospi_r, kosdaq_r = regime_pair_tuned(sp, kospi_br, kosdaq_br, bull_min, bear_min)
        combined = mrm.classify_regime_combined(kospi_r, kosdaq_r)
        if combined == "CRASH":
            continue

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(COMMON["top_n"]))

        selected = None
        for _, cand in day_cands.iterrows():
            code     = cand["asset_code"]
            exchange = exchange_map.get(code, "KOSDAQ")
            exc_reg  = kospi_r if exchange == "KOSPI" else kosdaq_r

            if exc_reg in ("BEAR", "CRASH"):
                continue
            cfg = RELAX if exc_reg == "BULL" else STRICT
            nb_min, ma_min = cfg["nb_min"], cfg["ma_min"]

            ecd = base.get_nth_day(code, sp, COMMON["delay"])
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
            "bull_min": bull_min, "bear_min": bear_min,
            "period": period,
            "exchange": exchange_map.get(cand["asset_code"], "KOSDAQ"),
            "regime": f"K:{kospi_r}/D:{kosdaq_r}",
            "signal_date": sd, "asset_code": cand["asset_code"],
            "asset_name": cand["asset_name"],
            "entry_date": ecd, "exit_date": exit_day,
            "ret": ret, "reason": reason,
        })

    return pd.DataFrame(trades)


# ── Metrics ───────────────────────────────────────────────────────────────────

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
    return {"avg": monthly.mean(), "worst": monthly.min(),
            "n": len(s), "win": (s["ret"] > 0).mean()}


def pct(v):
    return "-" if v is None else f"{v*100:.2f}%"


def passes(pre, train, post):
    if not pre or not train:
        return False
    return (pre["avg"] > 0 and train["avg"] >= 0.40
            and train["worst"] >= -0.13 and train["win"] >= 0.70
            and (post is None or post["avg"] >= 0))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Building exchange map...", flush=True)
    exchange_map = build_exchange_map()

    print("Building separate breadth...", flush=True)
    kospi_br, kosdaq_br = build_separate_breadth(exchange_map)
    print(f"  KOSPI breadth dates: {len(kospi_br)}  KOSDAQ: {len(kosdaq_br)}")

    frames, rows = [], []

    for bull_min in BULL_MINS:
        for bear_min in BEAR_MINS:
            label = f"B{bull_min}_b{bear_min}"
            print(f"  {label}...", flush=True)
            t = run_bt(bull_min, bear_min, exchange_map, kospi_br, kosdaq_br)
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

    all_trades = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    rows.sort(key=lambda r: (r["train_avg"] or -99), reverse=True)

    lines = [
        "# KOSPI/KOSDAQ 분리 레짐 임계값 Grid Search\n\n",
        f"date: {REPORT_DATE}\n\n",
        "개선사항:\n",
        "  1. KOSPI/KOSDAQ 별도 breadth 집계\n",
        "  2. per-index bull_min/bear_min 최적화\n\n",
        f"baseline 비교: train avg 53.59% (통합 레짐)\n\n",
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

    # Heatmap
    lines += ["\n## Train Avg Heatmap (분리 레짐)\n\n",
              "| bull_min \\ bear_min |" + "".join(f" {b} |" for b in BEAR_MINS) + "\n",
              "|---:|" + "---:|" * len(BEAR_MINS) + "\n"]
    for bul in BULL_MINS:
        cells = [pct(next((x["train_avg"] for x in rows
                           if x["bull_min"] == bul and x["bear_min"] == bear), None))
                 for bear in BEAR_MINS]
        lines.append(f"| {bul} |" + "".join(f" {c} |" for c in cells) + "\n")

    lines += [
        "\n## Notes\n\n",
        "- baseline(통합): train avg 53.59%, worst +12.96%, win 100%\n",
        "- 분리 레짐이 baseline 초과하면: 거래소별 필터 채택\n",
        "- 최적 조합으로 `market_regime_model.py` 단일지수 임계값 업데이트\n",
        f"- Trades: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")

    print(f"\n{'label':12} {'pass':4} {'train_avg':>10} {'worst':>8} {'win':>6} {'N':>4}")
    for r in rows[:6]:
        print(f"{r['label']:12} {r['pass']:4} "
              f"{pct(r['train_avg']):>10} {pct(r['train_worst']):>8} "
              f"{pct(r['train_win']):>6} {r['train_n']:>4}")


if __name__ == "__main__":
    main()
