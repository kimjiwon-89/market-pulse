"""
backtest_w4_allseason.py

방향 전환: 호황장 전용 → 전 시장 국면 대응.

핵심 변경:
  1. 시장 필터 제거/완화 → KOSPI 대비 상대강도(rel_ret60)로 대체
  2. 국면(bull/mixed/bear) 자동 감지 → 국면별 출구 파라미터 자동 적용
  3. 같은 신호, 다른 리스크 관리

국면 정의:
  bull  : KOSPI > MA20 AND KOSDAQ > MA20  (현재 both_ma20)
  mixed : KOSPI > MA60 (but not full bull)
  bear  : KOSPI <= MA60

출구 티어:
  bull  : 최대 60일, 조건부 연장, stop -12%, ef -6%
  mixed : 최대 35일, 연장 없음,  stop -12%, ef -6%
  bear  : 최대 20일, 연장 없음,  stop -10%, ef -5%

테스트 변형:
  ref_bma20         기존 baseline (reference)
  no_regime         시장 필터 완전 제거
  adaptive          국면별 출구 + KOSPI MA60 최소 기준
  adaptive_nomin    국면별 출구 + 시장 필터 없음
  rs_gate           상대강도 필터 추가 (시장 필터 없음)
  rs_adaptive       상대강도 + 국면별 출구

Writes:
  .Codex/reports/2026-05-26_w4-allseason.md
  .Codex/reports/2026-05-26_w4-allseason-trades.csv
"""
import os
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import pandas as pd
import backtest_v3fin_early_fail as base

# ── extra indicators ───────────────────────────────────────────────────────────
_g = base.df.groupby("asset_code", group_keys=False)
base.df["ma5"]  = _g["close_price"].transform(lambda x: x.rolling(5,  min_periods=5).mean())
base.df["ma10"] = _g["close_price"].transform(lambda x: x.rolling(10, min_periods=10).mean())

# 종목 상대강도: KOSPI 대비 ret20 / ret60 차이
_kospi = (base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == "KOSPI")]
          .copy().sort_values("trade_date"))
_kospi["kospi_ret20"] = (_kospi["close_price"] - _kospi["close_price"].shift(20)) / _kospi["close_price"].shift(20)
_kospi["kospi_ret60"] = (_kospi["close_price"] - _kospi["close_price"].shift(60)) / _kospi["close_price"].shift(60)
kospi_ret20_map = dict(zip(_kospi["trade_date"], _kospi["kospi_ret20"]))
kospi_ret60_map = dict(zip(_kospi["trade_date"], _kospi["kospi_ret60"]))

_kosdaq = (base.df[(base.df["asset_type"] == "INDEX") & (base.df["asset_code"] == "KOSDAQ")]
           .copy().sort_values("trade_date"))
_kosdaq["ma60"] = _kosdaq["close_price"].rolling(60, min_periods=60).mean()
kosdaq_ma60_map = dict(zip(_kosdaq["trade_date"], _kosdaq["close_price"] > _kosdaq["ma60"]))
_kosdaq["ma20"] = _kosdaq["close_price"].rolling(20, min_periods=20).mean()
kosdaq_ma20_map = dict(zip(_kosdaq["trade_date"], _kosdaq["close_price"] > _kosdaq["ma20"]))

_local = base.df[base.df["asset_type"] == "STOCK"].copy()
_lidx  = _local.set_index(["asset_code", "trade_date"])


# ── regime tier ───────────────────────────────────────────────────────────────
def regime_tier(signal_date):
    d = pd.Timestamp(signal_date)
    kospi_ma20 = base.index_regime_maps.get("KOSPI_ma20", {}).get(d, True)
    kosdaq_ma20 = kosdaq_ma20_map.get(d, True)
    kospi_ma60 = base.index_regime_maps.get("KOSPI_ma60", {}).get(d, True)
    if kospi_ma20 and kosdaq_ma20:
        return "bull"
    elif kospi_ma60:
        return "mixed"
    else:
        return "bear"


# 국면별 출구 파라미터
TIER_EXITS = {
    "bull":  dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                  base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20),
    "mixed": dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                  base_mh=None, mh=35, extension_tp=None),
    "bear":  dict(stop=-0.10, ef=-0.05, efd=3, ts=0.15, tp=0.15,
                  base_mh=None, mh=20, extension_tp=None),
}


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


def simulate_exit(prices, stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                  base_mh=None, extend_ret=0.25, mh=30, extension_tp=None):
    """범용 시뮬레이션. base_mh=None이면 단순 trail-stop exit."""
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"
    entry = float(prices.iloc[0]["open"])
    peak  = entry
    extended = (base_mh is None)  # base_mh 없으면 단순 모드
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
        # 조건부 연장 (base_mh 있을 때만)
        if base_mh is not None and not extended and i >= base_mh - 1:
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


PERIODS = [
    ("pre",   base.PRE_START,   base.PRE_END),
    ("train", base.TRAIN_START, base.TRAIN_END),
    ("post",  base.POST_START,  base.POST_END),
]

# ── 변형 설정 ─────────────────────────────────────────────────────────────────
# regime_mode: "bull_only" | "kospi_ma60" | "adaptive" | "none"
# rel_ret60_min: KOSPI 대비 60일 상대강도 최소값 (None=비활성)
COMMON_ENTRY = dict(
    delay=5, top_n=10, entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.08,
    entry_body=0.0, entry_ma20_min=0.05, entry_next_body_min=0.01, cadence_days=5,
)
VARIANTS = [
    # regime_mode, rel_ret60_min, fixed_exit_override (None=use adaptive)
    ("ref_bma20",      "bull_only",  None,  dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                                                   base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20)),
    ("no_regime",      "none",       None,  dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                                                   base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20)),
    ("no_regime_t",    "none",       None,  None),   # no_regime + adaptive exit
    ("kospi_ma60",     "kospi_ma60", None,  dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                                                   base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20)),
    ("adaptive",       "kospi_ma60", None,  None),   # KOSPI MA60 base + adaptive exit per tier
    ("adaptive_nomin", "none",       None,  None),   # no regime filter + adaptive exit per tier
    ("rs_gate",        "none",       0.10,  dict(stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20,
                                                   base_mh=30, extend_ret=0.25, mh=60, extension_tp=0.20)),
    ("rs_adaptive",    "none",       0.10,  None),   # rel strength + adaptive exit
    ("rs_tight",       "none",       0.15,  None),   # tighter rel strength + adaptive exit
    ("rs_kospi60",     "kospi_ma60", 0.10,  None),   # KOSPI MA60 + rel strength + adaptive
]


def run_bt(label, regime_mode, rel_ret60_min, fixed_exit):
    sig_dates = sorted(base.candidates["trade_date"].unique())
    cadence, prev = [], None
    for d in sig_dates:
        idx = base.date_to_idx.get(d)
        if idx is None:
            continue
        if prev is None or idx - prev >= COMMON_ENTRY["cadence_days"]:
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

        # 국면 감지
        tier = regime_tier(sp)

        # 시장 필터
        if regime_mode == "bull_only" and tier != "bull":
            continue
        if regime_mode == "kospi_ma60" and tier == "bear":
            continue
        # "none" or "adaptive": pass all

        # 상대강도 필터
        if rel_ret60_min is not None:
            kr60 = kospi_ret60_map.get(sp)
            # 종목 신호가 아직 없으니 여기서는 KOSPI 대비 후보군 점검은
            # 후보 선택 루프에서 한다. 여기서는 KOSPI 자체가 너무 강한지만 체크.
            # (실제 상대강도는 아래 종목별로 계산)

        # 출구 결정
        exit_params = fixed_exit if fixed_exit is not None else TIER_EXITS[tier]
        mh = exit_params.get("mh", 30)

        day_cands = (base.candidates[base.candidates["trade_date"] == sp]
                     .sort_values("score", ascending=False).head(COMMON_ENTRY["top_n"]))
        selected = None
        for _, cand in day_cands.iterrows():
            code = cand["asset_code"]

            # 상대강도 체크 (종목별)
            if rel_ret60_min is not None:
                kr60 = kospi_ret60_map.get(sp)
                stock_ret60 = float(cand["ret60"])
                if kr60 is not None and (stock_ret60 - kr60) < rel_ret60_min:
                    continue

            ecd = base.get_nth_day(code, sp, COMMON_ENTRY["delay"])
            if ecd is None:
                continue
            try:
                er = base.df_indexed.loc[(code, ecd)]
            except KeyError:
                continue
            sig_close = float(cand["close_price"])
            ent_close = float(er["close_price"])
            if (ent_close - sig_close) / sig_close < COMMON_ENTRY["entry_drawdown"]:
                continue
            if float(er["candle_loc"])   < COMMON_ENTRY["entry_loc"]:
                continue
            if float(er["upper_shadow"]) > COMMON_ENTRY["entry_shadow"]:
                continue
            if float(er["body_ret"])     < COMMON_ENTRY["entry_body"]:
                continue
            if (ent_close - float(er["ma20"])) / float(er["ma20"]) < COMMON_ENTRY["entry_ma20_min"]:
                continue
            nxt = base.get_nth_day(code, ecd, 1)
            if nxt is None:
                continue
            try:
                nr = base.df_indexed.loc[(code, nxt)]
                if float(nr["body_ret"]) < COMMON_ENTRY["entry_next_body_min"]:
                    continue
            except KeyError:
                continue
            selected = (cand, ecd, nxt)
            break

        if selected is None:
            continue

        cand, ecd, exday = selected
        future   = get_future_rows(cand["asset_code"], exday, mh + 1)
        exit_day, ret, reason = simulate_exit(future, **exit_params)
        if exit_day is None:
            continue

        exit_m = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_m] = month_pnl.get(exit_m, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = ("pre"   if sp <= pd.Timestamp(base.PRE_END)
                  else ("train" if sp <= pd.Timestamp(base.TRAIN_END) else "post"))

        kr60 = kospi_ret60_map.get(sp)
        stock_ret60 = float(cand["ret60"])
        rel_r60 = (stock_ret60 - kr60) if kr60 is not None else None

        trades.append({
            "variant":    label,
            "tier":       tier,
            "period":     period,
            "signal_date": sd,
            "asset_code": cand["asset_code"],
            "asset_name": cand["asset_name"],
            "entry_date": exday,
            "exit_date":  exit_day,
            "ret":        ret,
            "reason":     reason,
            "rel_ret60":  rel_r60,
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
    s["year"] = pd.to_datetime(s["signal_date"]).dt.year
    s["ym"]   = pd.to_datetime(s["exit_date"]).dt.to_period("M")
    result = {}
    for yr, grp in s.groupby("year"):
        monthly = grp.groupby("ym")["ret"].sum()
        result[yr] = {"avg": monthly.mean(), "n": len(grp), "win": (grp["ret"] > 0).mean()}
    return result


def tier_breakdown(trades, start, end):
    if len(trades) == 0:
        return {}
    s = trades[
        (pd.to_datetime(trades["signal_date"]) >= pd.Timestamp(start)) &
        (pd.to_datetime(trades["signal_date"]) <= pd.Timestamp(end))
    ].copy()
    if len(s) == 0:
        return {}
    result = {}
    for tier, grp in s.groupby("tier"):
        grp = grp.copy()
        grp["ym"] = pd.to_datetime(grp["exit_date"]).dt.to_period("M")
        monthly = grp.groupby("ym")["ret"].sum()
        result[tier] = {"avg": monthly.mean(), "n": len(grp), "win": (grp["ret"] > 0).mean()}
    return result


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    rows, frames, ranks = [], [], []

    for label, regime_mode, rel_min, fixed_exit in VARIANTS:
        print(f"  {label}  [{regime_mode}  rs>={rel_min}  exit={'adaptive' if fixed_exit is None else 'fixed'}]...", flush=True)
        trades = run_bt(label, regime_mode, rel_min, fixed_exit)
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
                train["avg"]   >= 0.30 and   # 목표 낮춤 (전 국면 대응이므로)
                train["worst"] >= -0.20 and
                train["win"]   >= 0.60 and
                (post is None or post["avg"] >= 0)
            )
            score = (train["avg"] + train["win"] * 0.15
                     + min(pre["avg"], 0.15) + train["worst"] * 0.5
                     + (0.05 if post and post["avg"] >= 0 else -0.05))
            ranks.append((label, pass_all, score, pre, train, post))

    out = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    trades_path = ".Codex/reports/2026-05-26_w4-allseason.csv"
    out.to_csv(trades_path, index=False, encoding="utf-8-sig")

    ranks.sort(key=lambda x: (x[1], x[2]), reverse=True)

    lines = [
        "# W4 All-Season Grid\n\n",
        "date: 2026-05-26\n",
        f"pre: {base.PRE_START}~{base.PRE_END}\n",
        f"train: {base.TRAIN_START}~{base.TRAIN_END}\n",
        f"post: {base.POST_START}~{base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass | score | pre avg | train avg | train worst | train win | post avg | N train | N post | N pre |\n",
        "|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, pass_all, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {'Y' if pass_all else 'N'} | {score:.4f} | "
            f"{pct(pre['avg'])} | {pct(train['avg'])} | {pct(train['worst'])} | "
            f"{pct(train['win'])} | {pct(post['avg'] if post else None)} | "
            f"{train['n']} | {post['n'] if post else 0} | {pre['n']} |\n"
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

    # 국면별 + 연도별 breakdown for top variants
    top_labels = [label for label, *_ in ranks[:5]]
    top_trades = {label: t for label, _, _, _, _, _ in ranks[:5]
                  for t in [out[out["variant"] == label]] if len(t) > 0}

    all_years = sorted({
        pd.Timestamp(sd).year
        for t in top_trades.values()
        for sd in (t["signal_date"].tolist() if len(t) > 0 else [])
    })

    if all_years:
        lines.append("\n## Year-by-Year (top 5 variants — avg monthly % by signal year)\n\n")
        hdr = " | ".join(str(y) for y in all_years)
        sep = " | ".join("---" for _ in all_years)
        lines.append(f"| variant | period | {hdr} |\n|---|---| {sep} |\n")
        for label, t in top_trades.items():
            for period, start, end in PERIODS:
                yb = year_breakdown(t, start, end)
                cells = " | ".join(pct(yb[y]["avg"]) if y in yb else "-" for y in all_years)
                lines.append(f"| {label} | {period} | {cells} |\n")

    # 국면(tier)별 breakdown
    lines.append("\n## Tier Breakdown (top 5 variants — full period)\n\n")
    lines.append("| variant | tier | avg monthly | N | win |\n|---|---|---:|---:|---:|\n")
    for label, t in top_trades.items():
        for period, start, end in PERIODS:
            tb = tier_breakdown(t, start, end)
            for tier in ["bull", "mixed", "bear"]:
                if tier in tb:
                    m = tb[tier]
                    lines.append(
                        f"| {label} | {tier}({period}) | {pct(m['avg'])} | {m['n']} | {pct(m['win'])} |\n"
                    )

    lines += [
        "\n## Readout\n\n",
        "- ref_bma20: 기존 both_ma20 baseline (reference).\n",
        "- no_regime: 시장 필터 완전 제거 — 상대강도 없이 모든 국면 진입.\n",
        "- adaptive: KOSPI MA60 최소 + 국면별 출구(bull 60d / mixed 35d / bear 20d).\n",
        "- rs_gate: 상대강도 rel_ret60 >= 0.10 추가.\n",
        "- rs_adaptive: 상대강도 + 국면별 출구 조합.\n",
        "- Pass 기준 완화: train>=30%, worst>=-20%, win>=60%, post>=0%.\n",
        f"- Trades: `{trades_path}`\n",
    ]

    report_path = ".Codex/reports/2026-05-26_w4-allseason.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {report_path}")


if __name__ == "__main__":
    main()
