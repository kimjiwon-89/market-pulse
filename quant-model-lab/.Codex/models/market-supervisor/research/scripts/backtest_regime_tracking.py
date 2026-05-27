"""Regime prediction tracking & improvement iterations.

For each analysis date D, records regime at D and compares with
actual regime at D+1, D+5, D+10, D+21. Measures prediction stability
and identifies where/why the model drifts.

3 iterations:
  iter1: baseline (current model, no filter)
  iter2: persistence filter (regime must hold N consecutive days)
  iter3: transition risk score (boundary detection)

Writes:
  .Codex/reports/2026-05-27_regime-tracking-iter{1,2,3}.md
  .Codex/reports/2026-05-27_regime-tracking-iter{1,2,3}-trades.csv
"""
import os
os.environ.setdefault("W4_PRE_START", "2012-01-01")

import datetime
import pandas as pd
import market_regime_model as mrm
import backtest_v3fin_regime_breakdown as regime_base

REPORT_DATE = "2026-05-27"
HORIZONS = [1, 5, 10, 21]   # trading days ahead
SNAPSHOT_CSV = ".Codex/reports/2026-05-27_market-regime-snapshot.csv"

# ── Load snapshot ─────────────────────────────────────────────────────────────

def load_snapshot() -> pd.DataFrame:
    df = pd.read_csv(SNAPSHOT_CSV)
    df["trade_date"] = pd.to_datetime(df["trade_date"])
    df = df.sort_values("trade_date").reset_index(drop=True)
    return df


# ── Regime classification variants ───────────────────────────────────────────

def classify_baseline(row: pd.Series) -> str:
    """Iter1: current model, no filter."""
    features = {
        "kospi_above_ma20":      float(row["kospi_close"]) > float(row["kospi_ma20"]),
        "kospi_above_ma60":      float(row["kospi_close"]) > float(row["kospi_ma60"]),
        "kosdaq_above_ma20":     float(row["kosdaq_close"]) > float(row["kosdaq_ma20"]),
        "kosdaq_above_ma60":     float(row["kosdaq_close"]) > float(row["kosdaq_ma60"]),
        "kospi_ma20_slope":      (float(row["kospi_ma20"]) - float(row["kospi_ma60"])) / float(row["kospi_ma60"]),
        "kosdaq_ma20_slope":     (float(row["kosdaq_ma20"]) - float(row["kosdaq_ma60"])) / float(row["kosdaq_ma60"]),
        "kospi_vol20":           float(row["volatility_20"]),
        "kosdaq_vol20":          float(row["volatility_20"]),
        "breadth_ma20":          float(row["breadth_ma20"]),
        "breadth_ma60":          float(row["breadth_ma60"]),
        "advance_ratio_5d":      float(row.get("advance_ratio_5d", 0.5)),
        "liquidity_trend":       float(row.get("liquidity_trend", 0.0)),
    }
    return mrm.classify_regime(features)


# ── Build tracking table ──────────────────────────────────────────────────────

def build_tracking(df: pd.DataFrame, classify_fn, persistence_n: int = 1) -> pd.DataFrame:
    """
    For each date D, compute:
      - regime at D (using classify_fn)
      - regime at D+h for each h in HORIZONS
      - match_h: 1 if same, 0 if different
    """
    dates = df["trade_date"].tolist()
    date_to_idx = {d: i for i, d in enumerate(dates)}

    # Compute regime for every date
    regimes = []
    raw_regimes = [classify_fn(df.iloc[i]) for i in range(len(df))]

    if persistence_n > 1:
        # Persistence filter: only flip if new regime holds for persistence_n days
        stable = [raw_regimes[0]]
        for i in range(1, len(raw_regimes)):
            start = max(0, i - persistence_n + 1)
            window = raw_regimes[start:i+1]
            candidate = raw_regimes[i]
            if window.count(candidate) >= persistence_n:
                stable.append(candidate)
            else:
                stable.append(stable[-1])
        regimes = stable
    else:
        regimes = raw_regimes

    rows = []
    for i, (date, regime_d) in enumerate(zip(dates, regimes)):
        row = {"date": date, "regime_D": regime_d}
        for h in HORIZONS:
            j = i + h
            if j < len(dates):
                row[f"regime_D{h}"] = regimes[j]
                row[f"match_{h}"] = 1 if regimes[j] == regime_d else 0
            else:
                row[f"regime_D{h}"] = None
                row[f"match_{h}"] = None
        rows.append(row)

    return pd.DataFrame(rows)


# ── Transition risk score (iter3) ────────────────────────────────────────────

def classify_with_risk(row: pd.Series, df: pd.DataFrame, idx: int) -> str:
    """Add transition risk: if bull_score or bear_score is at boundary, flag."""
    regime = classify_baseline(row)
    # If BULL but bull_score == BULL_SCORE_MIN (barely), flag as SIDEWAYS
    bull_s = int(row["bull_score"])
    bear_s = int(row["bear_score"])
    if regime == "BULL" and bull_s <= mrm.BULL_SCORE_MIN:
        return "SIDEWAYS"  # downgrade boundary BULL to SIDEWAYS
    if regime == "SIDEWAYS" and bear_s >= mrm.BEAR_SCORE_MIN - 1:
        return "BEAR"      # upgrade near-BEAR SIDEWAYS to BEAR
    return regime


# ── Metrics ───────────────────────────────────────────────────────────────────

def stability_metrics(track: pd.DataFrame) -> dict:
    out = {}
    for h in HORIZONS:
        col = f"match_{h}"
        valid = track[col].dropna()
        out[f"stability_{h}d"] = valid.mean() if len(valid) else 0.0
        out[f"n_{h}d"] = len(valid)
    return out


def transition_breakdown(track: pd.DataFrame) -> pd.DataFrame:
    """Count D->D+5 regime transitions."""
    col = "regime_D5"
    valid = track[["regime_D", col]].dropna()
    ct = valid.groupby(["regime_D", col]).size().reset_index(name="count")
    ct["pct"] = ct.groupby("regime_D")["count"].transform(lambda x: x / x.sum() * 100)
    return ct


def regime_stability_by_type(track: pd.DataFrame, h: int) -> pd.DataFrame:
    col = f"match_{h}"
    valid = track[["regime_D", col]].dropna()
    return valid.groupby("regime_D")[col].agg(["mean", "count"]).rename(
        columns={"mean": "stability", "count": "n"}
    ).reset_index()


def pct(v):
    return "-" if v is None else f"{v*100:.1f}%"


# ── Report writer ────────────────────────────────────────────────────────────

def write_report(iter_n: int, label: str, track: pd.DataFrame, improvement_notes: list[str]):
    out_md  = f".Codex/reports/{REPORT_DATE}_regime-tracking-iter{iter_n}.md"
    out_csv = f".Codex/reports/{REPORT_DATE}_regime-tracking-iter{iter_n}-detail.csv"

    track.to_csv(out_csv, index=False, encoding="utf-8-sig")

    m = stability_metrics(track)
    trans = transition_breakdown(track)

    lines = [
        f"# Regime Tracking — Iter {iter_n}: {label}\n\n",
        f"date: {REPORT_DATE}\n\n",
        "## 예측 안정성 (D 판단 vs 실제)\n\n",
        "| 기간 | 일치율 | N |\n",
        "|---|---:|---:|\n",
    ]
    for h in HORIZONS:
        lines.append(f"| D+{h:2d}d | {pct(m[f'stability_{h}d'])} | {m[f'n_{h}d']} |\n")

    # Per-regime stability at D+5
    lines += ["\n## Regime별 D+5 안정성\n\n",
              "| regime | 일치율 | N |\n",
              "|---|---:|---:|\n"]
    rs = regime_stability_by_type(track, 5)
    for _, r in rs.iterrows():
        lines.append(f"| {r['regime_D']} | {pct(r['stability'])} | {int(r['n'])} |\n")

    # Transition matrix D→D+5
    lines += ["\n## 전환 패턴 (D → D+5)\n\n",
              "| D | D+5 | 횟수 | 비율 |\n",
              "|---|---|---:|---:|\n"]
    for _, r in trans.iterrows():
        lines.append(f"| {r['regime_D']} | {r['regime_D5']} | {int(r['count'])} | {r['pct']:.1f}% |\n")

    lines += ["\n## 개선사항\n\n"]
    for note in improvement_notes:
        lines.append(f"- {note}\n")

    lines.append(f"\n- Detail: `{out_csv}`\n")

    with open(out_md, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"  saved {out_md}")
    return m


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading snapshot...", flush=True)
    df = load_snapshot()
    print(f"  {len(df)} dates: {df['trade_date'].min().date()} ~ {df['trade_date'].max().date()}")

    # ── Iter 1: Baseline ──────────────────────────────────────────────────────
    print("\nIter 1: baseline...", flush=True)
    track1 = build_tracking(df, classify_baseline, persistence_n=1)
    m1 = write_report(1, "Baseline (현재 모델)", track1, [
        "단순 당일 판단, 필터 없음",
        "→ D+1 안정성이 낮으면 persistence filter 적용 (Iter 2)",
        "→ 특정 regime에서 전환 빈도 높으면 경계 감지 추가 (Iter 3)",
    ])

    # ── Iter 2: Persistence filter ────────────────────────────────────────────
    print("Iter 2: persistence filter (3d)...", flush=True)
    track2 = build_tracking(df, classify_baseline, persistence_n=3)

    # Find improvement
    d1_imp = m1["stability_1d"]
    d5_imp = (stability_metrics(track2)["stability_5d"] - m1["stability_5d"])

    notes2 = [
        "3일 연속 동일 regime 확인 후 전환 (1일짜리 노이즈 제거)",
        f"→ D+1 안정성 기준치: {pct(m1['stability_1d'])} (iter1)",
    ]
    m2 = write_report(2, "Persistence Filter (3d)", track2, notes2)

    # ── Iter 3: Transition risk ───────────────────────────────────────────────
    print("Iter 3: transition risk score...", flush=True)

    def classify_iter3(row):
        # Use persistence_n=3 base + boundary downgrade/upgrade
        regime = classify_baseline(row)
        bull_s = int(float(row["bull_score"]))
        bear_s = int(float(row["bear_score"]))
        if regime == "BULL" and bull_s <= mrm.BULL_SCORE_MIN:
            return "SIDEWAYS"
        if regime == "SIDEWAYS" and bear_s >= mrm.BEAR_SCORE_MIN - 1:
            return "BEAR"
        return regime

    track3 = build_tracking(df, classify_iter3, persistence_n=3)
    m3 = stability_metrics(track3)

    notes3 = [
        "Persistence 3d + 경계 보수화 (BULL 경계→SIDEWAYS, SIDEWAYS 경계→BEAR)",
        f"D+5 안정성: iter1={pct(m1['stability_5d'])} → iter2={pct(m2['stability_5d'])} → iter3={pct(m3['stability_5d'])}",
    ]
    write_report(3, "Transition Risk Score", track3, notes3)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n=== Summary ===")
    print(f"{'':20} {'D+1':>8} {'D+5':>8} {'D+10':>8} {'D+21':>8}")
    for label, m in [("iter1 baseline", m1), ("iter2 persist-3d", m2), ("iter3 risk-adj", m3)]:
        print(f"{label:20} {pct(m['stability_1d']):>8} {pct(m['stability_5d']):>8} "
              f"{pct(m['stability_10d']):>8} {pct(m['stability_21d']):>8}")


if __name__ == "__main__":
    main()
