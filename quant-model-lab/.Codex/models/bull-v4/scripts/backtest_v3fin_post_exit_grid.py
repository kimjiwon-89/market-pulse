"""Post-focused exit grid for W4 V3-FIN.

Tests whether early-fail should use close confirmation or recovery grace.

Writes:
  .Codex/reports/2026-05-27_w4-v3fin-post-exit-grid.md
  .Codex/reports/2026-05-27_w4-v3fin-post-exit-grid-trades.csv
"""
import os
import throttle  # noqa: F401 - side effect: cap CPU threads, lower process priority

import pandas as pd

os.environ.setdefault("W4_PRE_START", "2012-01-01")
import backtest_v3fin_exit_grid as prev


REPORT_DATE = "2026-05-27"
OUT_MD = f".Codex/reports/{REPORT_DATE}_w4-v3fin-post-exit-grid.md"
OUT_CSV = f".Codex/reports/{REPORT_DATE}_w4-v3fin-post-exit-grid-trades.csv"


PERIODS = prev.PERIODS

EXIT_VARIANTS = [
    ("base_cond_ext60_ret25_t20", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "low_touch",
    }),
    ("ef_close6_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "close", "ef": -0.06,
    }),
    ("ef_close8_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "close", "ef": -0.08,
    }),
    ("ef_recover_ma20_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "recover_ma20", "ef": -0.06,
    }),
    ("ef_low10_close6_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "low10_or_close6", "ef": -0.06,
    }),
    ("ef_day5_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "low_touch", "efd": 5,
    }),
    ("no_ef_cond_ext60", {
        "mh": 60, "base_mh": 30, "extend_ret": 0.25, "extend_ma": "ma20",
        "extension_tp": 0.20, "ef_mode": "none",
    }),
    ("ma5trail_post_guard", {
        "mh": 60, "ts": 0.20, "tp": None, "ma_trail": "ma5",
        "ef_mode": "recover_ma20", "ef": -0.06,
    }),
]


def should_early_fail(row, entry, ef, ef_mode):
    low_ret = (float(row["low"]) - entry) / entry
    close_ret = (float(row["close"]) - entry) / entry
    ma20 = row.get("ma20")

    if ef_mode == "none":
        return False
    if ef_mode == "close":
        return close_ret <= ef
    if ef_mode == "recover_ma20":
        if low_ret > ef:
            return False
        ma_ok = ma20 is not None and float(row["close"]) > float(ma20)
        recovered = close_ret >= -0.02
        return not (ma_ok and recovered)
    if ef_mode == "low10_or_close6":
        return low_ret <= -0.10 or close_ret <= ef
    return low_ret <= ef


def simulate_exit(prices, stop=-0.12, ef=-0.06, efd=3, ts=0.20, tp=0.20, mh=30,
                  ma_trail=None, base_mh=None, extend_ret=None, extend_ma=None,
                  extension_tp=None, ef_mode="low_touch"):
    if prices is None or len(prices) < 2:
        return None, None, "NO_DATA"

    entry = float(prices.iloc[0]["open"])
    peak = entry
    extended = base_mh is None

    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo = float(row["low"])
        hi = float(row["high"])
        close = float(row["close"])
        low_ret = (lo - entry) / entry

        if i < efd and should_early_fail(row, entry, ef, ef_mode):
            return row["trade_date"], ef - prev.base.COST, f"EARLY_FAIL_{ef_mode.upper()}"

        if low_ret <= stop:
            return row["trade_date"], stop - prev.base.COST, "STOP"

        peak = max(peak, hi)
        peak_ret = (peak - entry) / entry
        if peak_ret >= ts:
            if ma_trail:
                ma = row.get(ma_trail)
                if ma is not None and close < ma:
                    return row["trade_date"], (close - entry) / entry - prev.base.COST, f"{ma_trail.upper()}_TRAIL"
            elif tp is not None and (close - peak) / peak <= -tp:
                return row["trade_date"], (close - entry) / entry - prev.base.COST, "TRAIL"

        if base_mh is not None and i >= base_mh - 1 and not extended:
            ma_ok = True
            if extend_ma:
                ma = row.get(extend_ma)
                ma_ok = ma is not None and close > ma
            ret_ok = (close - entry) / entry >= (extend_ret or 0)
            if ma_ok and ret_ok:
                extended = True
                peak = max(peak, hi)
                continue
            return row["trade_date"], (close - entry) / entry - prev.base.COST, "MAX"

        if extended and extension_tp is not None and (close - peak) / peak <= -extension_tp:
            return row["trade_date"], (close - entry) / entry - prev.base.COST, "EXT_TRAIL"

        if i >= mh - 1:
            return row["trade_date"], (close - entry) / entry - prev.base.COST, "MAX"

    last = prices.iloc[-1]
    return last["trade_date"], (float(last["close"]) - entry) / entry - prev.base.COST, "MAX"


def run_bt(label, exit_params):
    sig_dates = sorted(prev.base.candidates["trade_date"].unique())
    cadence = []
    prev_idx = None
    for d in sig_dates:
        idx = prev.base.date_to_idx.get(d)
        if idx is None:
            continue
        if prev_idx is None or idx - prev_idx >= prev.COMMON_ENTRY["cadence_days"]:
            cadence.append(d)
            prev_idx = idx

    trades = []
    month_pnl = {}
    open_until = None
    for sd in cadence:
        sp = pd.Timestamp(sd)
        ym = (sp.year, sp.month)
        if month_pnl.get(ym, 0) <= -0.15:
            continue
        if open_until is not None and sp <= open_until:
            continue
        if not prev.base.pass_regime(sp, prev.COMMON_ENTRY["regime"]):
            continue

        day_candidates = prev.base.candidates[prev.base.candidates["trade_date"] == sp].sort_values("score", ascending=False).head(prev.COMMON_ENTRY["top_n"])
        selected = None
        for _, cand in day_candidates.iterrows():
            code = cand["asset_code"]
            entry_check_day = prev.base.get_nth_day(code, sp, prev.COMMON_ENTRY["delay"])
            if entry_check_day is None:
                continue
            try:
                er = prev.base.df_indexed.loc[(code, entry_check_day)]
            except KeyError:
                continue
            if (float(er["close_price"]) - float(cand["close_price"])) / float(cand["close_price"]) < prev.COMMON_ENTRY["entry_drawdown"]:
                continue
            if float(er["candle_loc"]) < prev.COMMON_ENTRY["entry_loc"]:
                continue
            if float(er["upper_shadow"]) > prev.COMMON_ENTRY["entry_shadow"]:
                continue
            if float(er["body_ret"]) < prev.COMMON_ENTRY["entry_body"]:
                continue
            ma20_dist = (float(er["close_price"]) - float(er["ma20"])) / float(er["ma20"])
            if ma20_dist < prev.COMMON_ENTRY["entry_ma20_min"]:
                continue
            next_day = prev.base.get_nth_day(code, entry_check_day, 1)
            if next_day is None:
                continue
            try:
                nr = prev.base.df_indexed.loc[(code, next_day)]
                if float(nr["body_ret"]) < prev.COMMON_ENTRY["entry_next_body_min"]:
                    continue
            except KeyError:
                continue
            selected = (cand, entry_check_day, next_day)
            break
        if selected is None:
            continue

        cand, entry_check_day, execution_day = selected
        params = {"stop": -0.12, "ef": -0.06, "efd": 3, **exit_params}
        future = prev.get_future_rows(cand["asset_code"], execution_day, params.get("mh", 30) + 1)
        exit_day, ret, reason = simulate_exit(future, **params)
        if exit_day is None:
            continue
        exit_month = (pd.Timestamp(exit_day).year, pd.Timestamp(exit_day).month)
        month_pnl[exit_month] = month_pnl.get(exit_month, 0) + ret
        open_until = pd.Timestamp(exit_day)
        period = "pre" if sp <= pd.Timestamp(prev.base.PRE_END) else ("train" if sp <= pd.Timestamp(prev.base.TRAIN_END) else "post")
        trades.append({
            "variant": label,
            "period": period,
            "signal_date": sd,
            "asset_code": cand["asset_code"],
            "asset_name": cand["asset_name"],
            "entry_check_date": entry_check_day,
            "entry_date": execution_day,
            "exit_date": exit_day,
            "ret": ret,
            "reason": reason,
            "sig_range20": cand["range20"],
            "sig_ret60": cand["ret60"],
        })
    return pd.DataFrame(trades)


def pct(v):
    return "-" if v is None else f"{v * 100:.2f}%"


def main():
    rows = []
    ranks = []
    frames = []
    for label, params in EXIT_VARIANTS:
        trades = run_bt(label, params)
        frames.append(trades)
        metrics = {}
        for period, start, end in PERIODS:
            m = prev.metric(trades, start, end)
            metrics[period] = m
            if m is None:
                rows.append([label, period, None, None, None, 0, None, 0, 0])
            else:
                rows.append([label, period, m["avg"], m["total"], m["worst"], m["n"], m["win"], m["early"], m["stop"]])

        pre = metrics["pre"]
        train = metrics["train_to_2025_07"]
        post = metrics["post_from_2025_07"]
        if pre and train:
            pass_core = pre["avg"] > 0 and train["avg"] >= 0.40 and train["worst"] >= -0.13 and train["win"] >= 0.70
            pass_post = post is not None and post["avg"] >= 0
            score = train["avg"] + train["win"] * 0.20 + min(pre["avg"], 0.20) + train["worst"]
            if pass_post:
                score += 0.10
            elif post:
                score += post["avg"]
            ranks.append([label, pass_core, pass_post, score, pre, train, post])

    out = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    out.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    ranks.sort(key=lambda x: (x[1], x[2], x[3]), reverse=True)

    lines = [
        "# W4 V3-FIN Post Exit Grid\n\n",
        f"date: {REPORT_DATE}\n",
        f"pre: {prev.base.PRE_START}~{prev.base.PRE_END}\n",
        f"train: {prev.base.TRAIN_START}~{prev.base.TRAIN_END}\n",
        f"post: {prev.base.POST_START}~{prev.base.POST_END}\n\n",
        "## Ranking\n\n",
        "| rank | variant | pass40 | post>=0 | score | pre avg | train avg | train worst | train win | post avg | N train | N post |\n",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n",
    ]
    for i, (label, pass_core, pass_post, score, pre, train, post) in enumerate(ranks, 1):
        lines.append(
            f"| {i} | {label} | {'Y' if pass_core else 'N'} | {'Y' if pass_post else 'N'} | {score:.4f} | "
            f"{pct(pre['avg'])} | {pct(train['avg'])} | {pct(train['worst'])} | "
            f"{pct(train['win'])} | {pct(post['avg'] if post else None)} | {train['n']} | {post['n'] if post else 0} |\n"
        )

    lines.extend([
        "\n## Full Result\n\n",
        "| variant | period | avg monthly | total | worst | N | win | early fail | stop |\n",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|\n",
    ])
    for label, period, avg, total, worst, n, win, early, stop in rows:
        if avg is None:
            lines.append(f"| {label} | {period} | - | - | - | 0 | - | 0 | 0 |\n")
        else:
            lines.append(
                f"| {label} | {period} | {avg*100:.2f}% | {total*100:.2f}% | "
                f"{worst*100:.2f}% | {n} | {win*100:.1f}% | {early} | {stop} |\n"
            )

    lines.extend([
        "\n## Readout\n\n",
        "- Post loss source: 2025-09-17 COSES hit intraday early-fail, then rose sharply.\n",
        "- This grid tests whether early-fail needs close confirmation or MA20 recovery grace.\n",
        "- Promote only if train stays >=40%, worst >=-13%, win >=70%, pre positive, and post >=0.\n",
        f"- Trades: `{OUT_CSV}`\n",
    ])

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print(f"saved {OUT_MD}")


if __name__ == "__main__":
    main()
