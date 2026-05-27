"""KOSPI/KOSDAQ 분리 레짐 백테스트.

종목의 상장 거래소에 따라 KOSPI/KOSDAQ 레짐을 각각 적용.
- KOSPI 종목 → KOSPI 레짐으로 진입 허용/차단
- KOSDAQ 종목 → KOSDAQ 레짐으로 진입 허용/차단
- 종합 레짐이 CRASH이면 전종목 차단

비교 대상:
  baseline    : 기존 통합 레짐 (router_strict_sideways)
  split       : KOSPI/KOSDAQ 분리 레짐
  split_strict: 분리 레짐 + 양쪽 다 BULL일 때만 완화 진입

Writes:
  .Codex/reports/2026-05-27_regime-split-exchange.md
  .Codex/reports/2026-05-27_regime-split-exchange-trades.csv
"""
import os
import sys
os.environ.setdefault("W4_PRE_START", "2012-01-01")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "bull-v4", "scripts"))

import psycopg2
import pandas as pd
import market_regime_model as mrm
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_regime-split-exchange.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_regime-split-exchange-trades.csv"

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


# ── Exchange mapping ──────────────────────────────────────────────────────────

def build_exchange_map() -> dict[str, str]:
    """Returns {asset_code: 'KOSPI' | 'KOSDAQ'}."""
    conn = psycopg2.connect(**DB)
    try:
        df = pd.read_sql(
            "SELECT DISTINCT asset_code, sector FROM market_daily_price "
            "WHERE asset_type='STOCK' AND close_price > 0",
            conn,
        )
    finally:
        conn.close()
    mapping = {}
    for _, row in df.iterrows():
        mapping[row["asset_code"]] = "KOSPI" if row["sector"] == "KOSPI" else "KOSDAQ"
    return mapping


# ── Regime classification ─────────────────────────────────────────────────────

def regime_pair(signal_date) -> tuple[str, str]:
    """Returns (kospi_regime, kosdaq_regime) for a signal date."""
    features = regime_base.regime_features(signal_date)
    kospi_r  = mrm.classify_regime_kospi(features)
    kosdaq_r = mrm.classify_regime_kosdaq(features)
    return kospi_r, kosdaq_r


def combined_regime(signal_date) -> str:
    """Original combined regime (for baseline comparison)."""
    features = regime_base.regime_features(signal_date)
    return mrm.classify_regime(features)


# ── Policies ──────────────────────────────────────────────────────────────────

def allowed_split(exchange: str, kospi_r: str, kosdaq_r: str) -> bool:
    """Allow trade if the stock's exchange regime is not BEAR/CRASH."""
    r = kospi_r if exchange == "KOSPI" else kosdaq_r
    return r not in ("BEAR", "CRASH")


def entry_cfg_split(exchange: str, kospi_r: str, kosdaq_r: str) -> dict:
    """Strict entry when SIDEWAYS, relaxed when BULL."""
    r = kospi_r if exchange == "KOSPI" else kosdaq_r
    return RELAX if r == "BULL" else STRICT


def allowed_split_strict(exchange: str, kospi_r: str, kosdaq_r: str) -> bool:
    """Allow only if exchange regime is BULL; block SIDEWAYS too."""
    r = kospi_r if exchange == "KOSPI" else kosdaq_r
    return r == "BULL"


# ── Backtest runner ───────────────────────────────────────────────────────────

def run_bt(policy_name: str, exchange_map: dict) -> pd.DataFrame:
    use_split       = "split" in policy_name
    strict_only     = policy_name == "split_strict"

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

        if use_split:
            kospi_r, kosdaq_r = regime_pair(sp)
            # Global crash check
            combined_r = mrm.classify_regime_combined(kospi_r, kosdaq_r)
            if combined_r == "CRASH":
                continue
        else:
            reg = combined_regime(sp)
            if reg in ("BEAR", "CRASH"):
                continue

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(COMMON["top_n"]))

        selected = None
        for _, cand in day_cands.iterrows():
            code = cand["asset_code"]

            if use_split:
                exchange = exchange_map.get(code, "KOSDAQ")
                if strict_only:
                    if not allowed_split_strict(exchange, kospi_r, kosdaq_r):
                        continue
                    nb_min, ma_min = RELAX["nb_min"], RELAX["ma_min"]
                else:
                    if not allowed_split(exchange, kospi_r, kosdaq_r):
                        continue
                    cfg = entry_cfg_split(exchange, kospi_r, kosdaq_r)
                    nb_min, ma_min = cfg["nb_min"], cfg["ma_min"]
            else:
                nb_min = STRICT["nb_min"] if reg == "SIDEWAYS" else RELAX["nb_min"]
                ma_min = STRICT["ma_min"] if reg == "SIDEWAYS" else RELAX["ma_min"]

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

        exc = exchange_map.get(cand["asset_code"], "KOSDAQ") if use_split else "-"
        reg_label = (f"K:{kospi_r}/D:{kosdaq_r}" if use_split else reg)

        trades.append({
            "policy": policy_name, "period": period,
            "exchange": exc, "regime": reg_label,
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
    return {
        "avg": monthly.mean(), "worst": monthly.min(),
        "n": len(s), "win": (s["ret"] > 0).mean(),
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


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Building exchange map...", flush=True)
    exchange_map = build_exchange_map()
    kospi_n  = sum(1 for v in exchange_map.values() if v == "KOSPI")
    kosdaq_n = sum(1 for v in exchange_map.values() if v == "KOSDAQ")
    print(f"  KOSPI={kospi_n} KOSDAQ={kosdaq_n}")

    POLICIES = ["baseline", "split", "split_strict"]
    frames, summary = [], []

    for policy_name in POLICIES:
        print(f"  {policy_name}...", flush=True)
        t = run_bt(policy_name, exchange_map)
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
        "# KOSPI/KOSDAQ 분리 레짐 백테스트\n\n",
        f"date: {REPORT_DATE}\n\n",
        "정책:\n",
        "  baseline    : 기존 통합 레짐 (BEAR/CRASH 차단, SIDEWAYS 엄격)\n",
        "  split       : 거래소별 레짐 (KOSPI 종목→KOSPI 레짐, KOSDAQ 종목→KOSDAQ 레짐)\n",
        "  split_strict: 거래소별 레짐 + BULL일 때만 진입 허용\n\n",
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

    # Exchange breakdown for split policy (train period)
    if len(all_trades):
        lines += ["\n## 거래소별 성과 (train, split 정책)\n\n",
                  "| exchange | avg ret | N | win |\n",
                  "|---|---:|---:|---:|\n"]
        st = all_trades[all_trades["policy"] == "split"]
        st_train = st[
            (pd.to_datetime(st["signal_date"]) >= pd.Timestamp(base.TRAIN_START)) &
            (pd.to_datetime(st["signal_date"]) <= pd.Timestamp(base.TRAIN_END))
        ]
        for exc in ["KOSPI", "KOSDAQ"]:
            g = st_train[st_train["exchange"] == exc]
            if len(g):
                lines.append(f"| {exc} | {pct(g['ret'].mean())} | {len(g)} | {pct((g['ret']>0).mean())} |\n")

    lines += [
        "\n## Notes\n\n",
        "- split이 baseline보다 좋으면: 거래소 분리 판단이 유효.\n",
        "- KOSDAQ 성과가 나쁘면: KOSDAQ 레짐 임계값 조정 검토.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")

    print(f"\n{'policy':15} {'pass':4} {'train_avg':>10} {'worst':>8} {'win':>6} {'N':>4}")
    for r in summary:
        print(f"{r['policy']:15} {r['pass']:4} "
              f"{pct(r['train_avg']):>10} {pct(r['train_worst']):>8} "
              f"{pct(r['train_win']):>6} {r['train_n']:>4}")


if __name__ == "__main__":
    main()
