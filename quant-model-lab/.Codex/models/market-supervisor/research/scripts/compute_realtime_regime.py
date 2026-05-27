"""
compute_realtime_regime.py

Lightweight realtime market regime snapshot.

Designed for AWS Free Tier (t2.micro: 1 vCPU, 1 GB RAM) and older hardware.

Key design:
  - Loads only last 70 days of data (not 14 years)
  - Heavy aggregations done in SQL, not Python
  - No pandas for the final compute step
  - < 50 MB RAM, < 5 seconds runtime

Usage:
  python compute_realtime_regime.py
  python compute_realtime_regime.py --save   # also writes to quant_market_regime_snapshot
  python compute_realtime_regime.py --date 2026-05-20   # specific date

Output: JSON to stdout + optional DB write
"""
import json
import argparse
import datetime
import os
import psycopg2

from market_regime_model import (
    features_from_index_levels, compute_snapshot,
    classify_regime_persistent, PERSISTENCE_DAYS,
    classify_regime_kospi, classify_regime_kosdaq, classify_regime_combined,
)

DB = dict(
    host=os.getenv("MP_DB_HOST", "localhost"),
    port=int(os.getenv("MP_DB_PORT", "5432")),
    dbname=os.getenv("MP_DB_NAME", "marketpulse"),
    user=os.getenv("MP_DB_USER", "postgres"),
    password=os.getenv("MP_DB_PASSWORD", "postgreskh"),
)

# Rolling window sizes
MA_LONG   = 60
MA_SHORT  = 20
SLOPE_LAG = 5
LOOKBACK  = MA_LONG + SLOPE_LAG + 5  # 70 days of index data is enough
DEFAULT_BREADTH_LIMIT = int(os.getenv("MP_REGIME_BREADTH_LIMIT", "500"))


# ── SQL: index features (single query, last 70 rows per code) ─────────────────
# All rolling math done in SQL → Python gets a single ready row per index

INDEX_SQL = """
WITH raw AS (
    SELECT trade_date, asset_code, close_price,
           (close_price / NULLIF(LAG(close_price) OVER (PARTITION BY asset_code ORDER BY trade_date), 0) - 1) AS daily_ret
    FROM market_daily_price
    WHERE asset_code IN ('KOSPI', 'KOSDAQ')
      AND trade_date >= %(from_date)s
      AND trade_date <= %(to_date)s
      AND close_price > 0
),
with_ma AS (
    SELECT trade_date, asset_code, close_price, daily_ret,
           AVG(close_price) OVER w20 AS ma20,
           AVG(close_price) OVER w60 AS ma60,
           STDDEV(daily_ret)         OVER w20 AS vol20
    FROM raw
    WINDOW
        w20 AS (PARTITION BY asset_code ORDER BY trade_date
                ROWS BETWEEN %(ma_short_m1)s PRECEDING AND CURRENT ROW),
        w60 AS (PARTITION BY asset_code ORDER BY trade_date
                ROWS BETWEEN %(ma_long_m1)s  PRECEDING AND CURRENT ROW)
),
with_slope AS (
    SELECT trade_date, asset_code, close_price, ma20, ma60, vol20,
           LAG(ma20, %(slope_lag)s) OVER (PARTITION BY asset_code ORDER BY trade_date) AS ma20_lag
    FROM with_ma
)
SELECT trade_date, asset_code, close_price, ma20, ma60, vol20,
       CASE WHEN ma20_lag IS NOT NULL AND ma20_lag > 0
            THEN (ma20 - ma20_lag) / ma20_lag
            ELSE 0 END AS ma20_slope5
FROM with_slope
WHERE trade_date = %(target_date)s
"""


# ── SQL: market breadth (aggregated in SQL, returns 1 row) ───────────────────
# Compute stock MA20 inline and group → only summary comes back to Python

BREADTH_SQL = """
WITH universe AS (
    SELECT asset_code
    FROM market_daily_price
    WHERE asset_type = 'STOCK'
      AND trade_date = %(target_date)s
      AND close_price > 0
      AND volume > 0
    ORDER BY volume * close_price DESC
    LIMIT %(breadth_limit)s
),
stock_prices AS (
    SELECT asset_code, trade_date, close_price,
           volume * close_price AS trade_amount
    FROM market_daily_price
    WHERE asset_type = 'STOCK'
      AND trade_date >= %(from_date)s
      AND trade_date <= %(to_date)s
      AND close_price > 0
      AND asset_code IN (SELECT asset_code FROM universe)
),
stock_ma AS (
    SELECT asset_code, trade_date, close_price, trade_amount,
           AVG(close_price) OVER (
               PARTITION BY asset_code
               ORDER BY trade_date
               ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
           ) AS ma20,
           AVG(close_price) OVER (
               PARTITION BY asset_code
               ORDER BY trade_date
               ROWS BETWEEN 59 PRECEDING AND CURRENT ROW
           ) AS ma60,
           LAG(close_price, 5) OVER (
               PARTITION BY asset_code ORDER BY trade_date
           ) AS close_5d_ago
    FROM stock_prices
),
target AS (
    SELECT asset_code, trade_date, close_price, trade_amount, ma20, ma60, close_5d_ago
    FROM stock_ma
    WHERE trade_date = %(target_date)s
      AND ma20 IS NOT NULL
),
liq_base AS (
    SELECT trade_date,
           SUM(trade_amount) AS total_amount
    FROM stock_ma
    GROUP BY trade_date
),
liq_ma AS (
    SELECT trade_date, total_amount,
           AVG(total_amount) OVER (
               ORDER BY trade_date
               ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
           ) AS amount_ma20
    FROM liq_base
)
SELECT
    COUNT(*)                                                    AS stock_count,
    AVG(CASE WHEN t.close_price > t.ma20 THEN 1.0 ELSE 0.0 END)  AS breadth_ma20,
    AVG(CASE WHEN t.close_price > t.ma60 THEN 1.0 ELSE 0.0 END)  AS breadth_ma60,
    AVG(CASE WHEN t.close_5d_ago IS NOT NULL
             THEN CASE WHEN t.close_price > t.close_5d_ago THEN 1.0 ELSE 0.0 END
             ELSE NULL END)                                     AS advance_ratio_5d,
    (SELECT CASE WHEN l.amount_ma20 > 0
                 THEN l.total_amount / l.amount_ma20 - 1
                 ELSE 0 END
     FROM liq_ma l WHERE l.trade_date = %(target_date)s LIMIT 1) AS liquidity_trend
FROM target t
"""


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS quant_market_regime_snapshot (
    trade_date DATE PRIMARY KEY,
    regime VARCHAR(20) NOT NULL,
    confidence NUMERIC(8, 6) NOT NULL,
    risk_budget NUMERIC(8, 6) NOT NULL,
    allowed_strategy VARCHAR(50) NOT NULL,
    bull_score NUMERIC(8, 6) NOT NULL,
    bear_score NUMERIC(8, 6) NOT NULL,
    stress_score NUMERIC(8, 6) NOT NULL,
    breadth_ma20 NUMERIC(8, 6),
    breadth_ma60 NUMERIC(8, 6),
    volatility_20 NUMERIC(12, 8),
    liquidity_trend NUMERIC(12, 8),
    created_at TIMESTAMP DEFAULT now()
)
"""


def get_target_date(conn, requested: str | None) -> datetime.date:
    if requested:
        return datetime.date.fromisoformat(requested)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT MAX(trade_date) FROM market_daily_price "
            "WHERE asset_code = 'KOSPI' AND close_price > 0"
        )
        return cur.fetchone()[0]


def load_index_features(conn, target_date: datetime.date) -> dict:
    from_date = target_date - datetime.timedelta(days=LOOKBACK * 2)  # 2x buffer for weekends/holidays
    params = {
        "from_date":    from_date,
        "to_date":      target_date,
        "target_date":  target_date,
        "slope_lag":    SLOPE_LAG,
        "ma_short_m1":  MA_SHORT - 1,
        "ma_long_m1":   MA_LONG  - 1,
    }
    with conn.cursor() as cur:
        cur.execute(INDEX_SQL, params)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]

    result = {}
    for row in rows:
        r = dict(zip(cols, row))
        result[r["asset_code"]] = r

    if "KOSPI" not in result or "KOSDAQ" not in result:
        missing = [c for c in ["KOSPI", "KOSDAQ"] if c not in result]
        raise ValueError(f"Missing index data for {target_date}: {missing}")

    return result


def load_breadth_features(conn, target_date: datetime.date, breadth_limit: int = DEFAULT_BREADTH_LIMIT) -> dict:
    # Need MA20 for stocks: 20 trading days ≈ 30 calendar days + safety buffer
    from_date = target_date - datetime.timedelta(days=110)
    params = {
        "from_date":     from_date,
        "to_date":       target_date,
        "target_date":   target_date,
        "breadth_limit": max(50, int(breadth_limit)),
    }
    with conn.cursor() as cur:
        cur.execute(BREADTH_SQL, params)
        row = cur.fetchone()
        cols = [d[0] for d in cur.description]

    if row is None or row[0] == 0:
        return {"breadth_ma20": 0.50, "breadth_ma60": 0.50,
                "advance_ratio_5d": 0.50, "liquidity_trend": 0.0}

    r = dict(zip(cols, row))
    return {
        "breadth_ma20":    float(r["breadth_ma20"] or 0.50),
        "breadth_ma60":    float(r["breadth_ma60"] or 0.50),
        "advance_ratio_5d": float(r["advance_ratio_5d"] or 0.50),
        "liquidity_trend": float(r["liquidity_trend"] or 0.0),
    }


def save_to_db(conn, snap):
    """Upsert regime snapshot into quant_market_regime_snapshot."""
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()

    upsert_sql = """
    INSERT INTO quant_market_regime_snapshot
        (trade_date, regime, confidence, risk_budget, allowed_strategy,
         bull_score, bear_score, stress_score,
         breadth_ma20, breadth_ma60, volatility_20, liquidity_trend, created_at)
    VALUES
        (%(trade_date)s, %(regime)s, %(confidence)s, %(risk_budget)s, %(allowed_strategy)s,
         %(bull_score)s, %(bear_score)s, %(stress_score)s,
         %(breadth_ma20)s, %(breadth_ma60)s, %(volatility_20)s, %(liquidity_trend)s, NOW())
    ON CONFLICT (trade_date) DO UPDATE SET
        regime           = EXCLUDED.regime,
        confidence       = EXCLUDED.confidence,
        risk_budget      = EXCLUDED.risk_budget,
        allowed_strategy = EXCLUDED.allowed_strategy,
        bull_score       = EXCLUDED.bull_score,
        bear_score       = EXCLUDED.bear_score,
        stress_score     = EXCLUDED.stress_score,
        breadth_ma20     = EXCLUDED.breadth_ma20,
        breadth_ma60     = EXCLUDED.breadth_ma60,
        volatility_20    = EXCLUDED.volatility_20,
        liquidity_trend  = EXCLUDED.liquidity_trend,
        created_at       = NOW()
    """
    with conn.cursor() as cur:
        cur.execute(upsert_sql, snap.as_dict())
    conn.commit()


def load_recent_regimes(conn, target_date: datetime.date) -> list[str]:
    """Load last (PERSISTENCE_DAYS-1) regime labels from snapshot table for persistence filter."""
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT regime FROM quant_market_regime_snapshot "
                "WHERE trade_date < %s ORDER BY trade_date DESC LIMIT %s",
                (target_date, PERSISTENCE_DAYS - 1),
            )
            rows = cur.fetchall()
        return [r[0] for r in reversed(rows)]  # oldest first
    except Exception:
        conn.rollback()
        return []


def run(target_date_str: str | None = None, save: bool = False, breadth_limit: int = DEFAULT_BREADTH_LIMIT) -> dict:
    conn = psycopg2.connect(**DB)
    try:
        target_date = get_target_date(conn, target_date_str)

        idx     = load_index_features(conn, target_date)
        breadth = load_breadth_features(conn, target_date, breadth_limit=breadth_limit)

        kospi  = idx["KOSPI"]
        kosdaq = idx["KOSDAQ"]

        kospi_vol  = float(kospi["vol20"] or 0)
        kosdaq_vol = float(kosdaq["vol20"] or 0)

        features = features_from_index_levels(
            kospi_close=float(kospi["close_price"]),
            kospi_ma20=float(kospi["ma20"]),
            kospi_ma60=float(kospi["ma60"]),
            kospi_ma20_slope_5d=float(kospi["ma20_slope5"] or 0),
            kospi_vol20=kospi_vol,
            kosdaq_close=float(kosdaq["close_price"]),
            kosdaq_ma20=float(kosdaq["ma20"]),
            kosdaq_ma60=float(kosdaq["ma60"]),
            kosdaq_ma20_slope_5d=float(kosdaq["ma20_slope5"] or 0),
            kosdaq_vol20=kosdaq_vol,
            breadth_ma20=breadth["breadth_ma20"],
            breadth_ma60=breadth["breadth_ma60"],
            advance_ratio_5d=breadth["advance_ratio_5d"],
            liquidity_trend=breadth["liquidity_trend"],
        )
        # Separate vol for per-index classification
        features["kospi_vol20"]  = kospi_vol
        features["kosdaq_vol20"] = kosdaq_vol

        # Per-index regime
        kospi_regime  = classify_regime_kospi(features)
        kosdaq_regime = classify_regime_kosdaq(features)
        combined_raw  = classify_regime_combined(kospi_regime, kosdaq_regime)

        # Persistence filter on combined regime
        recent        = load_recent_regimes(conn, target_date)
        stable_regime = classify_regime_persistent(features, recent)
        # Override: use the more conservative of persistence-filtered vs combined
        _rank = {"CRASH": 0, "BEAR": 1, "SIDEWAYS": 2, "BULL": 3}
        final_regime = min(stable_regime, combined_raw, key=lambda r: _rank[r])

        snap = compute_snapshot(features, trade_date=str(target_date))
        snap.regime           = final_regime
        snap.allowed_strategy = {"BULL": "W4_BREAKOUT", "SIDEWAYS": "W4_RESTRICT",
                                  "BEAR": "W4_RECOVER",  "CRASH": "CASH"}[final_regime]
        snap.risk_budget      = {"BULL": 1.0, "SIDEWAYS": 0.5, "BEAR": 0.2, "CRASH": 0.0}[final_regime]

        result = snap.as_dict()
        result["kospi_regime"]  = kospi_regime
        result["kosdaq_regime"] = kosdaq_regime
        result["combined_raw"]  = combined_raw

        if save:
            save_to_db(conn, snap)

        return result
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Realtime market regime snapshot")
    parser.add_argument("--date", default=None, help="Target date YYYY-MM-DD (default: latest)")
    parser.add_argument("--save", action="store_true", help="Write result to quant_market_regime_snapshot")
    parser.add_argument("--breadth-limit", type=int, default=DEFAULT_BREADTH_LIMIT, help="Top liquid stocks used for breadth, default 500")
    parser.add_argument("--quiet", action="store_true", help="JSON only, no labels")
    args = parser.parse_args()

    result = run(target_date_str=args.date, save=args.save, breadth_limit=args.breadth_limit)

    if args.quiet:
        print(json.dumps(result))
    else:
        print(f"\n=== Market Regime Snapshot: {result['trade_date']} ===")
        print(f"")
        print(f"  [KOSPI]   {result['kospi_regime']}")
        print(f"  [KOSDAQ]  {result['kosdaq_regime']}")
        print(f"  ───────────────────────────────")
        print(f"  [종합]    {result['regime']}  →  {result['allowed_strategy']}")
        print(f"")
        print(f"  Risk:      {result['risk_budget'] * 100:.0f}%   Confidence: {result['confidence'] * 100:.0f}%")
        print(f"  Bull/Bear: {result['bull_score']} / {result['bear_score']}")
        print(f"  Breadth20: {result['breadth_ma20'] * 100:.1f}%")
        print(f"  Vol20:     {result['volatility_20'] * 100:.2f}%")
        print(f"  Liquidity: {result['liquidity_trend'] * 100:+.1f}%")
        if args.save:
            print(f"  Saved to:  quant_market_regime_snapshot")
        print()


if __name__ == "__main__":
    main()
