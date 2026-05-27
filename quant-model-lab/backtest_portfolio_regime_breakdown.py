"""Portfolio mode + regime breakdown.

포트폴리오 모드(N=50+)로 샘플 확장 후 신호일 레짐 라벨 붙여
BULL / SIDEWAYS / BEAR / CRASH 별 성과 분석.

목적:
  - 단일 포지션 N=6 한계 극복
  - SIDEWAYS / BEAR 거래가 수익성 있는지 확인
  - 레짐 필터 정책 비교 (all / bull_sideways / bull_only)

Writes:
  .Codex/reports/2026-05-27_portfolio-regime-breakdown.md
  .Codex/reports/2026-05-27_portfolio-regime-breakdown-trades.csv
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

import throttle  # noqa: F401
import pandas as pd
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base
import market_regime_model as mrm

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_portfolio-regime-breakdown.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_portfolio-regime-breakdown-trades.csv"

SNAPSHOT_CSV = os.path.join(
    _root, ".Codex", "models", "market-supervisor", "research", "reports",
    "2026-05-27_market-regime-snapshot.csv"
)

base = post_grid.prev.base

CAPITAL        = 1_000_000_000
POSITION_CASH  = 100_000_000
MAX_POSITIONS  = 10
MAX_BUYS_DAY   = 5
LIQUIDITY_CAP  = 0.03

ENTRY = {
    "delay": 5, "top_n": 50,
    "entry_loc": 0.55, "entry_ma20_min": 0.02,
    "entry_next_body_min": 0.00,
}
EXIT_PARAMS = {"stop": -0.12, "ef": -0.06, "efd": 3, **post_grid.EXIT_VARIANTS[1][1]}

PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]

# ── fast helpers ──────────────────────────────────────────────────────────────

_date_pos = {
    code: {pd.Timestamp(d): i for i, d in enumerate(dates)}
    for code, dates in base.asset_dates.items()
}
_asset_frames = {
    code: grp.sort_values("trade_date").reset_index(drop=True)
    for code, grp in base.df[base.df["asset_type"] == "STOCK"].groupby("asset_code")
}
_frame_pos = {
    code: {pd.Timestamp(d): i for i, d in enumerate(f["trade_date"])}
    for code, f in _asset_frames.items()
}
_future_cache = {}


def _nth(code, date, n):
    dates = base.asset_dates.get(code)
    pos   = _date_pos.get(code, {}).get(pd.Timestamp(date))
    if dates is None or pos is None:
        return None
    idx = pos + n
    return dates[idx] if idx < len(dates) else None


def _future_rows(code, entry_date, n):
    key = (code, pd.Timestamp(entry_date), n)
    if key not in _future_cache:
        frame = _asset_frames.get(code)
        pos   = _frame_pos.get(code, {}).get(pd.Timestamp(entry_date))
        if frame is None or pos is None:
            _future_cache[key] = None
        else:
            chunk = frame.iloc[pos: pos + n + 1]
            _future_cache[key] = (
                pd.DataFrame({
                    "trade_date": chunk["trade_date"].values,
                    "open":  chunk["open_price"].astype(float).values,
                    "high":  chunk["high_price"].astype(float).values,
                    "low":   chunk["low_price"].astype(float).values,
                    "close": chunk["close_price"].astype(float).values,
                    "ma20":  chunk["ma20"].astype(float).values,
                }) if len(chunk) > 0 else None
            )
    return _future_cache[key]


def _entry_ok(cand, entry_day):
    try:
        er = base.df_indexed.loc[(cand["asset_code"], entry_day)]
    except KeyError:
        return False, None
    if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < -0.05:
        return False, None
    if float(er["candle_loc"])   < ENTRY["entry_loc"]:    return False, None
    if float(er["upper_shadow"]) > 0.08:                  return False, None
    if float(er["body_ret"])     < 0.0:                   return False, None
    ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
    if ma20_dist < ENTRY["entry_ma20_min"]: return False, None
    if float(er["close_price"]) * float(er["volume"]) * LIQUIDITY_CAP < POSITION_CASH:
        return False, None
    return True, er


def _entry_next_ok(code, entry_day):
    nxt = _nth(code, entry_day, 1)
    if nxt is None:
        return False
    try:
        nr = base.df_indexed.loc[(code, nxt)]
    except KeyError:
        return False
    return float(nr["body_ret"]) >= ENTRY["entry_next_body_min"]


# ── persistence-filtered regime lookup ───────────────────────────────────────

def _build_persistent_lookup():
    snap = pd.read_csv(SNAPSHOT_CSV, parse_dates=["trade_date"])
    snap = snap.sort_values("trade_date").reset_index(drop=True)
    raw_list = snap["regime"].tolist()
    stable   = mrm.apply_persistence_filter(raw_list, n=mrm.PERSISTENCE_DAYS)
    return dict(zip(snap["trade_date"], stable))


_REGIME_LOOKUP = _build_persistent_lookup()


def label_regime(signal_date):
    d = pd.Timestamp(signal_date)
    if d in _REGIME_LOOKUP:
        return _REGIME_LOOKUP[d]
    # fallback: raw classify
    features = regime_base.regime_features(signal_date)
    return regime_base.classify_regime(features)


# ── backtest ──────────────────────────────────────────────────────────────────

def run():
    sig_dates    = sorted(base.candidates["trade_date"].unique())
    open_pos     = []
    trades       = []

    for sd in sig_dates:
        sp = pd.Timestamp(sd)
        open_pos = [p for p in open_pos if p > sp]
        if not base.pass_regime(sp, "both_ma20"):
            continue
        slots = MAX_POSITIONS - len(open_pos)
        if slots <= 0:
            continue

        regime = label_regime(sp)
        period = ("pre" if sp <= pd.Timestamp(base.PRE_END)
                  else ("train" if sp <= pd.Timestamp(base.TRAIN_END) else "post"))

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False)
                     .head(ENTRY["top_n"]))
        bought = 0
        for _, cand in day_cands.iterrows():
            if bought >= min(slots, MAX_BUYS_DAY):
                break
            code = cand["asset_code"]
            ecd  = _nth(code, sp, ENTRY["delay"])
            if ecd is None:
                continue
            ok, _ = _entry_ok(cand, ecd)
            if not ok:
                continue
            if not _entry_next_ok(code, ecd):
                continue
            nxt = _nth(code, ecd, 1)
            if nxt is None:
                continue
            rows = _future_rows(code, nxt, EXIT_PARAMS.get("mh", 60) + 1)
            if rows is None:
                continue
            exit_day, ret, reason = post_grid.simulate_exit(rows, **EXIT_PARAMS)
            if exit_day is None:
                continue

            trades.append({
                "period": period, "regime": regime,
                "signal_date": sd, "asset_code": code,
                "asset_name": cand["asset_name"],
                "entry_date": nxt, "exit_date": exit_day,
                "ret": ret, "pnl_krw": ret * POSITION_CASH,
                "reason": reason,
            })
            open_pos.append(pd.Timestamp(exit_day))
            bought += 1

    return pd.DataFrame(trades)


# ── metrics ───────────────────────────────────────────────────────────────────

def metric(df, start, end):
    s = df[(pd.to_datetime(df["signal_date"]) >= pd.Timestamp(start)) &
           (pd.to_datetime(df["signal_date"]) <= pd.Timestamp(end))].copy()
    if len(s) == 0:
        return None
    s["ym"] = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    monthly  = s.groupby("ym")["pnl_krw"].sum() / CAPITAL
    return {
        "avg":   monthly.mean(),
        "worst": monthly.min(),
        "n":     len(s),
        "win":   (s["ret"] > 0).mean(),
        "early": int(s["reason"].str.contains("EARLY_FAIL").sum()),
        "stop":  int((s["reason"] == "STOP").sum()),
    }


def pct(v):
    return "-" if v is None else f"{v*100:.2f}%"


# ── policies ──────────────────────────────────────────────────────────────────

POLICIES = {
    "all":           {"BULL", "SIDEWAYS", "BEAR", "CRASH"},
    "bull_sideways": {"BULL", "SIDEWAYS"},
    "bull_only":     {"BULL"},
    "excl_bear":     {"BULL", "SIDEWAYS"},   # same as bull_sideways – alias for clarity
}


def apply_policy(df, allowed):
    return df[df["regime"].isin(allowed)]


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("Running portfolio backtest + regime labeling...", flush=True)
    all_trades = run()
    all_trades.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    print(f"  Total trades: {len(all_trades)}")

    # ── regime distribution ──
    print("\nRegime distribution (train):")
    train = all_trades[all_trades["period"] == "train"]
    for r, cnt in train["regime"].value_counts().items():
        print(f"  {r}: {cnt}")

    # ── per-regime breakdown (train) ──
    print("\nPer-regime performance (train):")
    for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
        sub = train[train["regime"] == r]
        if len(sub) == 0:
            print(f"  {r}: no trades")
            continue
        win = (sub["ret"] > 0).mean()
        avg_ret = sub["ret"].mean()
        print(f"  {r}: N={len(sub)}, win={win*100:.1f}%, avg_ret={avg_ret*100:.2f}%")

    # ── policy comparison ──
    lines = [
        "# Portfolio Regime Breakdown\n\n",
        f"date: {REPORT_DATE}\n",
        f"capital: {CAPITAL:,}  position: {POSITION_CASH:,}  max_pos: {MAX_POSITIONS}\n\n",
        "## Regime Distribution\n\n",
        "| period | BULL | SIDEWAYS | BEAR | CRASH | total |\n",
        "|---|---:|---:|---:|---:|---:|\n",
    ]
    for period, start, end in PERIODS:
        sub = all_trades[all_trades["period"] == period]
        total = len(sub)
        cnt = {r: int((sub["regime"] == r).sum()) for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]}
        lines.append(f"| {period} | {cnt['BULL']} | {cnt['SIDEWAYS']} | {cnt['BEAR']} | {cnt['CRASH']} | {total} |\n")

    lines += [
        "\n## Per-Regime Performance (전 기간)\n\n",
        "| regime | period | N | win | avg ret | worst month |\n",
        "|---|---|---:|---:|---:|---:|\n",
    ]
    for r in ["BULL", "SIDEWAYS", "BEAR", "CRASH"]:
        sub_r = all_trades[all_trades["regime"] == r]
        for period, start, end in PERIODS:
            m = metric(sub_r, start, end)
            if m:
                lines.append(
                    f"| {r} | {period} | {m['n']} | {pct(m['win'])} | {pct(m['avg'])} | {pct(m['worst'])} |\n"
                )

    lines += [
        "\n## Policy Comparison\n\n",
        "baseline: train avg 53.59%, worst +12.96%, win 100%, N=5 (단일포지션)\n\n",
        "| policy | period | N | win | avg(monthly) | worst |\n",
        "|---|---|---:|---:|---:|---:|\n",
    ]
    for policy_name, allowed in POLICIES.items():
        filtered = apply_policy(all_trades, allowed)
        for period, start, end in PERIODS:
            m = metric(filtered, start, end)
            if m:
                lines.append(
                    f"| {policy_name} | {period} | {m['n']} | {pct(m['win'])} | {pct(m['avg'])} | {pct(m['worst'])} |\n"
                )

    lines += [
        "\n## Notes\n\n",
        "- 포트폴리오 모드: 동시 최대 10 포지션, 릴렉스 진입\n",
        "- 레짐 라벨: 신호일 기준 (미래 수익률 불사용)\n",
        "- avg(monthly): 월별 포트폴리오 수익 / 총 자본\n",
        f"- Trades: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")


if __name__ == "__main__":
    main()
