WITH trading_days AS (
    SELECT DISTINCT trade_date,
           ROW_NUMBER() OVER (ORDER BY trade_date) AS td_idx
    FROM market_daily_price
    WHERE asset_type = 'STOCK'
      AND trade_date >= '2013-01-01'
),
base_indicators AS (
    SELECT
        m.trade_date, m.asset_code, m.asset_name,
        m.open_price, m.high_price, m.low_price, m.close_price, m.volume,
        td.td_idx,
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS ma20,
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS ma60,
        AVG((m.high_price - m.low_price) / NULLIF(m.close_price, 0)) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS range20,
        (m.close_price / NULLIF(LAG(m.close_price, 60) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date), 0)) - 1 AS ret60,
        AVG(m.volume) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS vol_avg20,
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 14 PRECEDING AND 4 PRECEDING) AS ma20_5ago,
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 64 PRECEDING AND 4 PRECEDING) AS ma60_5ago,
        CASE WHEN (m.high_price - m.low_price) > 0 THEN (m.close_price - m.low_price) / (m.high_price - m.low_price) ELSE 0.5 END AS candle_location,
        CASE WHEN (m.high_price - m.low_price) > 0 THEN (m.high_price - m.close_price) / (m.high_price - m.low_price) ELSE 0 END AS upper_shadow,
        COUNT(*) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS hist60
    FROM market_daily_price m
    JOIN trading_days td ON m.trade_date = td.trade_date
    WHERE m.asset_type = 'STOCK' AND m.close_price > 0
),
indicators AS (
    SELECT *,
        (close_price / NULLIF(ma60, 0)) - 1 AS ma60_dist,
        volume::numeric / NULLIF(vol_avg20, 0) AS volume_expansion,
        CASE WHEN ma20_5ago > 0 THEN (ma20 - ma20_5ago) / ma20_5ago ELSE NULL END AS ma20_slope5,
        CASE WHEN ma60_5ago > 0 THEN (ma60 - ma60_5ago) / ma60_5ago ELSE NULL END AS ma60_slope5
    FROM base_indicators WHERE hist60 >= 60
),
w4_signals AS (
    SELECT *
    FROM indicators
    WHERE trade_date >= '2015-01-01' AND trade_date <= '2026-05-20'
      AND range20 >= 0.25 AND ret60 >= 0.20 AND ma60_dist > 0.05
      AND ma20 > ma60 AND range20 <= 0.55 AND volume_expansion <= 3.0
      AND ma20_slope5 > 0 AND ma60_slope5 > 0
      AND candle_location >= 0.45 AND upper_shadow <= 0.08
)
SELECT
    CASE WHEN trade_date < '2022-05-01' THEN 'pre' WHEN trade_date < '2025-08-01' THEN 'train' ELSE 'post' END AS period,
    COUNT(*) AS signal_count,
    COUNT(DISTINCT trade_date) AS signal_days,
    COUNT(DISTINCT asset_code) AS unique_stocks
FROM w4_signals
GROUP BY 1 ORDER BY 1;
