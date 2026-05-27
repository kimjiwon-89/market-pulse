"""RDS 2026 YTD operational replay for Bull V4 ap06.

Inputs:
  .Codex/tmp/rds_market_daily_price_2025-09_2026-05.csv

Writes:
  .Codex/reports/2026-05-27_bull-v4-rds-2026-ytd-operational-trades.csv
  .Codex/reports/2026-05-27_bull-v4-rds-2026-ytd-weekly.csv
  .Codex/reports/2026-05-27_bull-v4-rds-2026-ytd-operational-report.md
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pandas as pd


REPORT_DATE = "2026-05-27"
ROOT = Path(".")
INPUT = ROOT / ".Codex/tmp/rds_market_daily_price_2025-09_2026-05.csv"
OUT_TRADES = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2026-ytd-operational-trades.csv"
OUT_WEEKLY = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2026-ytd-weekly.csv"
OUT_MD = ROOT / f".Codex/reports/{REPORT_DATE}_bull-v4-rds-2026-ytd-operational-report.md"

BASE_SCRIPT = ROOT / ".Codex/models/bull-v4/scripts/analyze_rds_2025_operational_report.py"


def load_base():
    spec = importlib.util.spec_from_file_location("bull_v4_rds_ops_base", BASE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    module.INPUT = INPUT
    module.SIGNAL_FROM = pd.Timestamp("2026-01-01")
    module.SIGNAL_TO = pd.Timestamp("2026-05-27")
    module.POST_FROM = pd.Timestamp("2026-01-01")
    module.POST_TO = pd.Timestamp("2026-05-27")
    module.AP06["label"] = "BULL_V4_2026_YTD_AP06"
    return module


def pct(value: float | None) -> str:
    if value is None or pd.isna(value):
        return "-"
    return f"{value * 100:.2f}%"


def main():
    base = load_base()
    df = base.add_features(base.load_prices())
    maps = base.index_maps(df)
    candidates = base.build_candidates(df)
    ap06 = base.run_ap06(df, candidates, maps)
    weekly = base.weekly_table(ap06, pd.DataFrame())

    ap06.to_csv(OUT_TRADES, index=False, encoding="utf-8-sig")
    weekly.to_csv(OUT_WEEKLY, index=False, encoding="utf-8-sig")

    metrics = base.period_metrics(ap06)
    lines = [
        "# Bull V4 RDS 2026 YTD Operational Report\n\n",
        f"date: {REPORT_DATE}\n",
        "source: RDS `market_daily_price`, exported 2025-09-01~2026-05-27 for YTD replay\n",
        f"capital: {base.CAPITAL:,}\n",
        f"position_cash: {base.POSITION_CASH:,}\n",
        f"model: `{base.AP06['label']}`\n",
        "runtime_upload_config: `BULL_V4_5_0_0_BALANCED_PAPER`\n\n",
        "## Summary\n\n",
        "| trades | total on capital | avg month | best month | worst month | win | active entry days | entry days >=2 |\n",
        "|---:|---:|---:|---:|---:|---:|---:|---:|\n",
        f"| {metrics.get('trades', 0)} | {pct(metrics.get('total_capital'))} | {pct(metrics.get('avg_month'))} | "
        f"{pct(metrics.get('best_month'))} | {pct(metrics.get('worst_month'))} | {pct(metrics.get('win'))} | "
        f"{metrics.get('active_entry_days', 0)} | {metrics.get('entry_days_ge2', 0)} ({pct(metrics.get('entry_days_ge2_rate'))}) |\n",
        "\n## Trades\n\n",
    ]
    if len(ap06) == 0:
        lines.append("- No closed ap06 trades were produced for 2026 YTD.\n")
    else:
        lines.extend([
            "| signal_date | entry_date | exit_date | code | name | return | reason | pnl |\n",
            "|---|---|---|---|---|---:|---|---:|\n",
        ])
        for _, row in ap06.sort_values(["exit_date", "asset_code"]).iterrows():
            lines.append(
                f"| {pd.Timestamp(row['signal_date']).date()} | {pd.Timestamp(row['entry_date']).date()} | "
                f"{pd.Timestamp(row['exit_date']).date()} | {row['asset_code']} | {row['asset_name']} | "
                f"{pct(row['ret'])} | {row['reason']} | {row['pnl_krw']:,.0f} |\n"
            )
    lines.extend([
        "\n## Files\n\n",
        f"- Trades CSV: `{OUT_TRADES}`\n",
        f"- Weekly CSV: `{OUT_WEEKLY}`\n",
    ])
    OUT_MD.write_text("".join(lines), encoding="utf-8")
    print(f"saved {OUT_MD}")
    print(f"saved {OUT_TRADES}")
    print(f"saved {OUT_WEEKLY}")
    print(f"trades={len(ap06)}")


if __name__ == "__main__":
    main()
