"""Market Leading Model - 대리 선행 지표 기반 미래 방향 예측.

현재 레짐 모델(후행) 과 역할 분리:
  - 기존 모델: 현재 상태 분류 (BULL/SIDEWAYS/BEAR)
  - 이 모델: 향후 5~20일 시장 방향 예측

대리 선행 지표 (OHLCV 기반):
  1. breadth_thrust    : 10일 내 브레드스 40%→62% 돌파 (Zweig Breadth Thrust)
  2. breadth_5d_chg    : 브레드스 5일 변화량
  3. vol_surge         : 거래량 5일평균 / 20일평균 (시장 전체)
  4. adv_ratio_chg     : 상승종목 비율 10일 변화
  5. kosdaq_lead       : KOSDAQ 5d ret - KOSPI 5d ret
  6. momentum_div      : KOSPI 5d ret - 20d ret (단기 vs 장기 모멘텀)
  7. new_high_ratio    : 20일 신고가 종목 비율
  8. vol_price_confirm : 거래량 급증(>1.5x) AND 양봉 동시 발생 비율

Writes:
  .Codex/reports/2026-05-27_leading-model-features.csv
  .Codex/reports/2026-05-27_leading-model-validation.md
"""
import os, sys

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
import psycopg2
import backtest_v3fin_post_exit_grid as post_grid

REPORT_DATE = "2026-05-27"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_leading-model-features.csv"
OUT_MD  = f".Codex/reports/{REPORT_DATE}_leading-model-validation.md"

DB = dict(host="localhost", port=5432, dbname="marketpulse",
          user="postgres", password="postgreskh")

base = post_grid.prev.base

# ── 데이터 로드 ───────────────────────────────────────────────────────────────

def load_data():
    conn = psycopg2.connect(**DB)
    try:
        stocks = pd.read_sql(
            "SELECT trade_date, asset_code, close_price, volume, high_price "
            "FROM market_daily_price WHERE asset_type='STOCK' AND close_price > 0",
            conn, parse_dates=["trade_date"]
        )
        index_ = pd.read_sql(
            "SELECT trade_date, asset_code, close_price, volume "
            "FROM market_daily_price WHERE asset_type='INDEX'",
            conn, parse_dates=["trade_date"]
        )
        etf = pd.read_sql(
            "SELECT trade_date, asset_code, volume "
            "FROM market_daily_price WHERE asset_type='ETF' AND asset_code IN ('122630','114800')",
            conn, parse_dates=["trade_date"]
        )
    finally:
        conn.close()
    return stocks, index_, etf


# ── 지표 계산 ─────────────────────────────────────────────────────────────────

def build_features(stocks: pd.DataFrame, index_: pd.DataFrame, etf: pd.DataFrame) -> pd.DataFrame:
    print("Computing stock-level features...", flush=True)

    # 종목별 MA20, 20일 고가 계산
    stocks = stocks.sort_values(["asset_code", "trade_date"])
    stocks["ma20"]      = stocks.groupby("asset_code")["close_price"].transform(
                              lambda s: s.rolling(20, min_periods=20).mean())
    stocks["high20"]    = stocks.groupby("asset_code")["high_price"].transform(
                              lambda s: s.rolling(20, min_periods=20).max())
    stocks["vol_ma20"]  = stocks.groupby("asset_code")["volume"].transform(
                              lambda s: s.rolling(20, min_periods=20).mean())
    stocks["above_ma20"]  = (stocks["close_price"] > stocks["ma20"]).astype(float)
    stocks["new_high20"]  = (stocks["high_price"] >= stocks["high20"]).astype(float)
    stocks["vol_exp"]     = stocks["volume"] / stocks["vol_ma20"].replace(0, np.nan)
    stocks["is_up"]       = (stocks["close_price"] > stocks["close_price"].shift(1)).astype(float)
    stocks["vol_price_c"] = ((stocks["vol_exp"] > 1.5) & (stocks["is_up"] == 1)).astype(float)
    stocks["ret5"]        = stocks.groupby("asset_code")["close_price"].pct_change(5)

    print("Aggregating daily breadth...", flush=True)
    daily = stocks.groupby("trade_date").agg(
        breadth_ma20    = ("above_ma20",  "mean"),
        new_high_ratio  = ("new_high20",  "mean"),
        vol_surge_raw   = ("vol_exp",     "mean"),
        vol_price_confirm = ("vol_price_c","mean"),
        advance_ratio   = ("is_up",       "mean"),
        total_volume    = ("volume",      "sum"),
    ).reset_index()

    # 5d / 10d 변화량
    daily = daily.sort_values("trade_date")
    daily["breadth_5d_chg"]  = daily["breadth_ma20"].diff(5)
    daily["adv_ratio_chg"]   = daily["advance_ratio"].diff(10)

    # Zweig Breadth Thrust: 최근 10일 내 breadth가 0.40 이하 → 0.615 이상으로 상승했는지
    def breadth_thrust(series, window=10):
        was_low  = series.rolling(window).min() <= 0.40
        is_high  = series >= 0.615
        return (was_low & is_high).astype(float)

    daily["breadth_thrust"] = breadth_thrust(daily["breadth_ma20"])

    # 거래량 서지 (시장 전체 - 5d/20d)
    daily["vol_ma20_total"]  = daily["total_volume"].rolling(20, min_periods=20).mean()
    daily["vol_ma5_total"]   = daily["total_volume"].rolling(5,  min_periods=5).mean()
    daily["vol_surge"]       = daily["vol_ma5_total"] / daily["vol_ma20_total"].replace(0, np.nan)

    print("Computing index momentum...", flush=True)
    # KOSPI / KOSDAQ 모멘텀
    kospi  = index_[index_["asset_code"] == "KOSPI"].sort_values("trade_date").set_index("trade_date")
    kosdaq = index_[index_["asset_code"] == "KOSDAQ"].sort_values("trade_date").set_index("trade_date")

    for idx_df, prefix in [(kospi, "kospi"), (kosdaq, "kosdaq")]:
        idx_df[f"ret5"]  = idx_df["close_price"].pct_change(5)
        idx_df[f"ret20"] = idx_df["close_price"].pct_change(20)

    # merge
    daily = daily.set_index("trade_date")
    daily["kospi_ret5"]   = kospi["ret5"]
    daily["kospi_ret20"]  = kospi["ret20"]
    daily["kosdaq_ret5"]  = kosdaq["ret5"]

    daily["kosdaq_lead"]    = daily["kosdaq_ret5"] - daily["kospi_ret5"]
    daily["momentum_div"]   = daily["kospi_ret5"]  - daily["kospi_ret20"]

    # 레버리지/인버스 비율 (ETF 수집 후 유효, 그 전까지는 NaN)
    if not etf.empty:
        lvrg  = (etf[etf["asset_code"] == "122630"]
                 .set_index("trade_date")["volume"].rename("lvrg_vol"))
        invrs = (etf[etf["asset_code"] == "114800"]
                 .set_index("trade_date")["volume"].rename("invrs_vol"))
        daily = daily.join(lvrg,  on="trade_date", how="left")
        daily = daily.join(invrs, on="trade_date", how="left")
        daily["lvrg_invrs_ratio"] = daily["lvrg_vol"] / (daily["invrs_vol"].replace(0, np.nan))
    else:
        daily["lvrg_invrs_ratio"] = np.nan

    # 포워드 수익률 (라벨)
    daily["kospi_fwd5"]  = kospi["ret5"].shift(-5)
    daily["kospi_fwd20"] = daily["kospi_ret5"].shift(-20)   # reuse series
    daily["kospi_fwd20"] = kospi["close_price"].pct_change(20).shift(-20)

    daily = daily.dropna(subset=["breadth_ma20", "vol_surge", "kospi_ret5"])
    return daily.reset_index()


# ── 예측력 검증 ───────────────────────────────────────────────────────────────

FEATURES = [
    "breadth_thrust", "breadth_5d_chg", "vol_surge",
    "adv_ratio_chg", "kosdaq_lead", "momentum_div",
    "new_high_ratio", "vol_price_confirm",
    "lvrg_invrs_ratio",  # ETF 수집 후 유효
]

def validate(daily: pd.DataFrame):
    """각 지표와 D+5/D+20 포워드 수익률의 상관계수 + 방향 정확도."""
    rows = []
    for feat in FEATURES:
        col = daily[feat].dropna()
        valid = daily.loc[col.index].dropna(subset=["kospi_fwd5", "kospi_fwd20"])
        if len(valid) < 30:
            continue
        x  = valid[feat]
        f5  = valid["kospi_fwd5"]
        f20 = valid["kospi_fwd20"]

        # 상관계수
        corr5  = float(x.corr(f5))
        corr20 = float(x.corr(f20))

        # 방향 정확도: 지표 > 중앙값이면 포워드 수익률 > 0 예측
        med  = x.median()
        pos5  = (f5[x > med]  > 0).mean()
        pos20 = (f20[x > med] > 0).mean()
        neg5  = (f5[x <= med] > 0).mean()
        neg20 = (f20[x <= med]> 0).mean()

        # 방향 정확도: 신호 고/저에서 양/음 비율 차이
        dir_acc5  = abs(pos5  - neg5)
        dir_acc20 = abs(pos20 - neg20)

        rows.append({
            "feature": feat,
            "corr_fwd5": corr5, "corr_fwd20": corr20,
            "dir_acc_fwd5": dir_acc5, "dir_acc_fwd20": dir_acc20,
            "pos_rate_high_fwd5": pos5, "pos_rate_high_fwd20": pos20,
            "n": len(valid),
        })
    return pd.DataFrame(rows).sort_values("dir_acc_fwd20", ascending=False)


# ── 복합 점수 ─────────────────────────────────────────────────────────────────

def build_composite(daily: pd.DataFrame, top_features: list[str]) -> pd.DataFrame:
    """각 지표를 백분위 점수로 표준화해서 합산."""
    df = daily.copy()
    for feat in top_features:
        pct = df[feat].rank(pct=True)
        df[f"{feat}_pct"] = pct

    pct_cols = [f"{f}_pct" for f in top_features]
    df["leading_score"] = df[pct_cols].mean(axis=1)

    # 레이블: 상위 33% = BULL_LEAD, 하위 33% = BEAR_LEAD, 나머지 = NEUTRAL
    q33 = df["leading_score"].quantile(0.33)
    q67 = df["leading_score"].quantile(0.67)
    df["leading_signal"] = "NEUTRAL"
    df.loc[df["leading_score"] >= q67, "leading_signal"] = "BULL_LEAD"
    df.loc[df["leading_score"] <= q33, "leading_signal"] = "BEAR_LEAD"
    return df


# ── 신호별 포워드 수익률 ──────────────────────────────────────────────────────

def signal_perf(df: pd.DataFrame):
    rows = []
    for sig in ["BULL_LEAD", "NEUTRAL", "BEAR_LEAD"]:
        sub = df[df["leading_signal"] == sig].dropna(subset=["kospi_fwd5", "kospi_fwd20"])
        if len(sub) == 0:
            continue
        rows.append({
            "signal": sig,
            "n": len(sub),
            "fwd5_avg":  sub["kospi_fwd5"].mean(),
            "fwd5_pos":  (sub["kospi_fwd5"]  > 0).mean(),
            "fwd20_avg": sub["kospi_fwd20"].mean(),
            "fwd20_pos": (sub["kospi_fwd20"] > 0).mean(),
        })
    return pd.DataFrame(rows)


def pct(v):
    return "-" if v is None or (isinstance(v, float) and np.isnan(v)) else f"{v*100:.2f}%"


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading data...", flush=True)
    stocks, index_, etf = load_data()
    print(f"  stocks: {len(stocks):,}  index: {len(index_):,}  etf: {len(etf):,}")

    daily = build_features(stocks, index_, etf)
    print(f"  feature rows: {len(daily):,}  date range: {daily['trade_date'].min().date()} ~ {daily['trade_date'].max().date()}")

    daily.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    print(f"  saved {OUT_CSV}")

    print("\nValidating features...", flush=True)
    val = validate(daily)
    print(val[["feature","corr_fwd5","corr_fwd20","dir_acc_fwd5","dir_acc_fwd20"]].to_string(index=False))

    # 예측력 상위 지표로 복합 점수
    top_feats = val[val["dir_acc_fwd20"] >= 0.03]["feature"].tolist()
    if not top_feats:
        top_feats = val.head(5)["feature"].tolist()
    print(f"\nTop features for composite: {top_feats}")

    df_comp = build_composite(daily, top_feats)
    sp = signal_perf(df_comp)
    print("\nSignal performance (KOSPI forward):")
    print(sp.to_string(index=False))

    # ── 리포트 작성 ──────────────────────────────────────────────────────────
    lines = [
        "# Market Leading Model - Proxy Feature Validation\n\n",
        f"date: {REPORT_DATE}\n\n",
        "**목적:** 미래 방향 예측 (기존 레짐 모델은 현재 상태 분류)\n\n",
        "**방법:** 기존 OHLCV에서 선행 대리 지표 계산 → D+5/D+20 상관 검증\n\n",
        "## 1. 지표별 예측력\n\n",
        "| 지표 | corr D+5 | corr D+20 | 방향정확 D+5 | 방향정확 D+20 | N |\n",
        "|---|---:|---:|---:|---:|---:|\n",
    ]
    for _, r in val.iterrows():
        lines.append(
            f"| {r['feature']} | {r['corr_fwd5']:.3f} | {r['corr_fwd20']:.3f} |"
            f" {pct(r['dir_acc_fwd5'])} | {pct(r['dir_acc_fwd20'])} | {int(r['n'])} |\n"
        )

    lines += [
        "\n> 방향정확 = |신호 고구간 양성률 - 저구간 양성률|. 클수록 분별력 높음.\n\n",
        f"## 2. 복합 점수 (상위 지표: {', '.join(top_feats)})\n\n",
        "| 신호 | N | KOSPI D+5 avg | D+5 양률 | KOSPI D+20 avg | D+20 양률 |\n",
        "|---|---:|---:|---:|---:|---:|\n",
    ]
    for _, r in sp.iterrows():
        lines.append(
            f"| {r['signal']} | {int(r['n'])} |"
            f" {pct(r['fwd5_avg'])} | {pct(r['fwd5_pos'])} |"
            f" {pct(r['fwd20_avg'])} | {pct(r['fwd20_pos'])} |\n"
        )

    # 검증 요약
    bull_20 = sp[sp["signal"] == "BULL_LEAD"]["fwd20_avg"].values
    bear_20 = sp[sp["signal"] == "BEAR_LEAD"]["fwd20_avg"].values
    ok = len(bull_20) > 0 and len(bear_20) > 0 and float(bull_20[0]) > float(bear_20[0])

    lines += [
        "\n## 3. 검증 요약\n\n",
        f"- BULL_LEAD D+20: {pct(float(bull_20[0])) if len(bull_20) else '-'}\n",
        f"- BEAR_LEAD D+20: {pct(float(bear_20[0])) if len(bear_20) else '-'}\n",
        f"- 방향 검증 (BULL > BEAR): {'PASS' if ok else 'FAIL'}\n\n",
        "**결론:** " + (
            "복합 점수가 시장 방향을 선행 예측. 기존 레짐 모델과 결합 시 진입 필터 강화 가능.\n"
            if ok else
            "복합 점수의 방향 예측력 부족. 지표 재설계 또는 임계값 조정 필요.\n"
        ),
        f"\n- Features CSV: `{OUT_CSV}`\n",
    ]

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"\nsaved {OUT_MD}")


if __name__ == "__main__":
    main()
