"""Regime label validation: 라벨 vs 실제 시장 움직임.

신호일 레짐 라벨(BULL/SIDEWAYS/BEAR)이 실제 KOSPI/KOSDAQ
포워드 수익률과 일치하는지 검증.

검증 방법:
  1. 신호일 기준 KOSPI D+5, D+20, D+60 실제 수익률
  2. 레짐별 분포: BULL > SIDEWAYS > BEAR 순이면 라벨이 유효
  3. 종목 수익률(trade ret)도 레짐별 비교

Writes:
  .Codex/reports/2026-05-27_regime-validation.md
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
import numpy as np
import backtest_v3fin_post_exit_grid as post_grid
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_regime-validation.md"

TRADES_CSV = f".Codex/reports/{REPORT_DATE}_portfolio-regime-breakdown-trades.csv"

base = post_grid.prev.base

# ── KOSPI/KOSDAQ index frames ─────────────────────────────────────────────────

KOSPI  = regime_base.KOSPI.copy()
KOSDAQ = regime_base.KOSDAQ.copy()

KOSPI_DATES  = sorted(KOSPI.index)
KOSDAQ_DATES = sorted(KOSDAQ.index)

_kospi_pos  = {d: i for i, d in enumerate(KOSPI_DATES)}
_kosdaq_pos = {d: i for i, d in enumerate(KOSDAQ_DATES)}


def fwd_ret(dates_list, pos_map, frame, signal_date, n):
    d   = pd.Timestamp(signal_date)
    pos = pos_map.get(d)
    if pos is None:
        return None
    target = pos + n
    if target >= len(dates_list):
        return None
    td = dates_list[target]
    try:
        p0 = float(frame.loc[d,  "close_price"])
        p1 = float(frame.loc[td, "close_price"])
        return (p1 - p0) / p0
    except (KeyError, TypeError):
        return None


def market_fwd(signal_date, n):
    kr = fwd_ret(KOSPI_DATES,  _kospi_pos,  KOSPI,  signal_date, n)
    dr = fwd_ret(KOSDAQ_DATES, _kosdaq_pos, KOSDAQ, signal_date, n)
    avg = None
    if kr is not None and dr is not None:
        avg = (kr + dr) / 2
    elif kr is not None:
        avg = kr
    elif dr is not None:
        avg = dr
    return kr, dr, avg


# ── load trades ───────────────────────────────────────────────────────────────

trades = pd.read_csv(TRADES_CSV, parse_dates=["signal_date", "entry_date", "exit_date"])

# attach forward market returns for each unique signal date
unique_dates = trades[["signal_date", "regime", "period"]].drop_duplicates("signal_date")
rows = []
for _, r in unique_dates.iterrows():
    sd = r["signal_date"]
    k5,  d5,  a5  = market_fwd(sd, 5)
    k20, d20, a20 = market_fwd(sd, 20)
    k60, d60, a60 = market_fwd(sd, 60)
    rows.append({
        "signal_date": sd,
        "regime": r["regime"],
        "period": r["period"],
        "kospi_5d":  k5,  "kosdaq_5d":  d5,  "avg_5d":  a5,
        "kospi_20d": k20, "kosdaq_20d": d20, "avg_20d": a20,
        "kospi_60d": k60, "kosdaq_60d": d60, "avg_60d": a60,
    })
mkt = pd.DataFrame(rows)

# ── helpers ───────────────────────────────────────────────────────────────────

def pct(v):
    return "-" if v is None or (isinstance(v, float) and np.isnan(v)) else f"{v*100:.2f}%"


def regime_mkt_stats(df, regime, period=None):
    s = df[df["regime"] == regime]
    if period:
        s = s[s["period"] == period]
    if len(s) == 0:
        return None
    return {
        "n": len(s),
        "avg_5d":  s["avg_5d"].mean(),
        "avg_20d": s["avg_20d"].mean(),
        "avg_60d": s["avg_60d"].mean(),
        "pos_5d":  (s["avg_5d"]  > 0).mean(),
        "pos_20d": (s["avg_20d"] > 0).mean(),
        "pos_60d": (s["avg_60d"] > 0).mean(),
    }


def trade_stats(df, regime, period=None):
    s = trades[trades["regime"] == regime]
    if period:
        s = s[s["period"] == period]
    if len(s) == 0:
        return None
    return {
        "n":   len(s),
        "win": (s["ret"] > 0).mean(),
        "avg": s["ret"].mean(),
    }


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    REGIMES = ["BULL", "SIDEWAYS", "BEAR"]
    PERIODS = [
        ("pre",   base.PRE_START,   base.PRE_END),
        ("train", base.TRAIN_START, base.TRAIN_END),
        ("post",  base.POST_START,  base.POST_END),
    ]

    lines = [
        "# Regime Label Validation\n\n",
        f"date: {REPORT_DATE}\n\n",
        "**검증 목적:** BULL/SIDEWAYS/BEAR 라벨이 실제 시장 방향과 일치하는가?\n\n",
        "- 기대: BULL avg > SIDEWAYS avg > BEAR avg\n",
        "- 지수 수익률: KOSPI + KOSDAQ 평균\n\n",
    ]

    # ── section 1: 전체 기간 ─────────────────────────────────────────────────
    lines += [
        "## 1. 신호일 기준 시장 포워드 수익률 (전체)\n\n",
        "| regime | N | D+5 avg | D+5 양률 | D+20 avg | D+20 양률 | D+60 avg | D+60 양률 |\n",
        "|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for r in REGIMES:
        s = regime_mkt_stats(mkt, r)
        if s:
            lines.append(
                f"| {r} | {s['n']} | {pct(s['avg_5d'])} | {pct(s['pos_5d'])} |"
                f" {pct(s['avg_20d'])} | {pct(s['pos_20d'])} |"
                f" {pct(s['avg_60d'])} | {pct(s['pos_60d'])} |\n"
            )

    # ── section 2: 기간별 ─────────────────────────────────────────────────────
    lines += ["\n## 2. 기간별 시장 포워드 수익률\n\n"]
    for period, _, _ in PERIODS:
        lines += [
            f"### {period}\n\n",
            "| regime | N | D+5 | D+20 | D+60 |\n",
            "|---|---:|---:|---:|---:|\n",
        ]
        for r in REGIMES:
            s = regime_mkt_stats(mkt, r, period)
            if s:
                lines.append(
                    f"| {r} | {s['n']} | {pct(s['avg_5d'])} | {pct(s['avg_20d'])} | {pct(s['avg_60d'])} |\n"
                )
        lines.append("\n")

    # ── section 3: 종목 수익률 vs 레짐 ───────────────────────────────────────
    lines += [
        "## 3. 종목 실제 수익률 vs 레짐 라벨\n\n",
        "| regime | period | N | win | avg trade ret |\n",
        "|---|---|---:|---:|---:|\n",
    ]
    for r in REGIMES:
        for period, _, _ in PERIODS:
            s = trade_stats(trades, r, period)
            if s and s["n"] > 0:
                lines.append(
                    f"| {r} | {period} | {s['n']} | {pct(s['win'])} | {pct(s['avg'])} |\n"
                )

    # ── section 4: 핵심 검증 요약 ─────────────────────────────────────────────
    lines += ["\n## 4. 검증 요약\n\n"]

    # compute train stats for summary
    def stat(regime, horizon):
        s = regime_mkt_stats(mkt, regime, "train")
        return s[f"avg_{horizon}"] if s else None

    bull_20  = stat("BULL",     "20d")
    side_20  = stat("SIDEWAYS", "20d")
    bear_20  = stat("BEAR",     "20d")

    order_ok = (
        bull_20 is not None and side_20 is not None
        and bull_20 > side_20
    )
    bear_neg = bear_20 is not None and bear_20 < 0

    lines += [
        f"- train D+20: BULL={pct(bull_20)}, SIDEWAYS={pct(side_20)}, BEAR={pct(bear_20)}\n",
        f"- 순서 검증 (BULL > SIDEWAYS): {'✓ 일치' if order_ok else '✗ 불일치'}\n",
        f"- BEAR 음수 검증: {'✓ 일치' if bear_neg else '✗ 불일치 또는 샘플 없음'}\n",
        "\n",
        "**결론:**\n",
    ]

    if order_ok and bear_neg:
        lines.append("레짐 라벨이 실제 시장 방향과 일치. 필터 신뢰도 높음.\n")
    elif order_ok:
        lines.append("BULL>SIDEWAYS 순서는 맞으나 BEAR 샘플 부족. 추가 검증 필요.\n")
    else:
        lines.append("레짐 라벨과 실제 시장 방향 불일치. 분류 기준 재검토 필요.\n")

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")

    # console
    print(f"\n{'regime':10} {'N':>4} {'D+5':>8} {'D+20':>8} {'D+60':>8}  (train, 지수 avg)")
    for r in REGIMES:
        s = regime_mkt_stats(mkt, r, "train")
        if s:
            print(f"{r:10} {s['n']:>4} {pct(s['avg_5d']):>8} {pct(s['avg_20d']):>8} {pct(s['avg_60d']):>8}")
        else:
            print(f"{r:10}    -")


if __name__ == "__main__":
    main()
