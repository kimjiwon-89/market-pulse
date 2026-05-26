-- W4 Full Backtest: Extended Sensitivity Analysis
-- All indicators computed via window functions (no look-ahead)
-- Entry at close of entry_date (EOD execution)
-- Costs: 0.6% round trip

-- Temp table approach for performance
CREATE TEMP TABLE td_index AS
SELECT DISTINCT trade_date,
       ROW_NUMBER() OVER (ORDER BY trade_date) AS td_idx
FROM market_daily_price
WHERE asset_type = 'STOCK'
  AND trade_date >= '2013-01-01';

CREATE INDEX ON td_index(trade_date);
CREATE INDEX ON td_index(td_idx);

-- Compute all indicators
CREATE TEMP TABLE stock_indicators AS
SELECT
    m.trade_date,
    m.asset_code,
    m.asset_name,
    m.open_price,
    m.high_price,
    m.low_price,
    m.close_price,
    m.volume,
    td.td_idx,
    AVG(m.close_price) OVER w20 AS ma20,
    AVG(m.close_price) OVER w60 AS ma60,
    AVG((m.high_price - m.low_price) / NULLIF(m.close_price, 0)) OVER w20 AS range20,
    (m.close_price / NULLIF(LAG(m.close_price, 60) OVER wpart, 0)) - 1 AS ret60,
    AVG(m.volume::numeric) OVER w20 AS vol_avg20,
    AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 14 PRECEDING AND 4 PRECEDING) AS ma20_5ago,
    AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 64 PRECEDING AND 4 PRECEDING) AS ma60_5ago,
    CASE WHEN (m.high_price - m.low_price) > 0
         THEN (m.close_price - m.low_price) / (m.high_price - m.low_price)
         ELSE 0.5 END AS candle_location,
    CASE WHEN (m.high_price - m.low_price) > 0
         THEN (m.high_price - m.close_price) / (m.high_price - m.low_price)
         ELSE 0 END AS upper_shadow,
    COUNT(*) OVER w60 AS hist60
FROM market_daily_price m
JOIN td_index td ON m.trade_date = td.trade_date
WHERE m.asset_type = 'STOCK'
  AND m.close_price > 0
WINDOW
    wpart AS (PARTITION BY m.asset_code ORDER BY m.trade_date),
    w20 AS (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
    w60 AS (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 59 PRECEDING AND CURRENT ROW);

CREATE INDEX ON stock_indicators(asset_code, trade_date);
CREATE INDEX ON stock_indicators(trade_date);

-- W4 signals with derived indicators
CREATE TEMP TABLE w4_signals AS
SELECT
    trade_date,
    asset_code,
    asset_name,
    close_price AS signal_close,
    td_idx,
    ROW_NUMBER() OVER (PARTITION BY trade_date ORDER BY ret60 DESC, range20 DESC) AS daily_rank
FROM (
    SELECT *,
        (close_price / NULLIF(ma60, 0)) - 1 AS ma60_dist,
        volume::numeric / NULLIF(vol_avg20, 0) AS volume_expansion,
        CASE WHEN ma20_5ago > 0 THEN (ma20 - ma20_5ago) / ma20_5ago ELSE NULL END AS ma20_slope5,
        CASE WHEN ma60_5ago > 0 THEN (ma60 - ma60_5ago) / ma60_5ago ELSE NULL END AS ma60_slope5
    FROM stock_indicators
    WHERE hist60 >= 60
      AND trade_date >= '2015-01-01'
      AND trade_date <= '2026-05-20'
) ind
WHERE range20 >= 0.25
  AND ret60 >= 0.20
  AND ma60_dist > 0.05
  AND ma20 > ma60
  AND range20 <= 0.55
  AND volume_expansion <= 3.0
  AND ma20_slope5 > 0
  AND ma60_slope5 > 0
  AND candle_location >= 0.45
  AND upper_shadow <= 0.08;

CREATE INDEX ON w4_signals(trade_date, daily_rank);
CREATE INDEX ON w4_signals(asset_code, trade_date);

-- Entry candidates for each delay (1,3,5,10)
CREATE TEMP TABLE entry_candidates AS
SELECT
    s.trade_date AS signal_date,
    s.asset_code,
    s.asset_name,
    s.daily_rank,
    s.signal_close,
    d.delay_days AS delay,
    e_td.trade_date AS entry_date,
    e.open_price AS entry_open,
    e.high_price AS entry_high,
    e.low_price AS entry_low,
    e.close_price AS entry_close,
    CASE WHEN (e.high_price - e.low_price) > 0
         THEN (e.close_price - e.low_price) / (e.high_price - e.low_price)
         ELSE 0.5 END AS entry_candle_loc,
    CASE WHEN (e.high_price - e.low_price) > 0
         THEN (e.high_price - e.close_price) / (e.high_price - e.low_price)
         ELSE 0 END AS entry_upper_shadow,
    (e.close_price / NULLIF(s.signal_close, 0)) - 1 AS signal_to_entry_ret,
    (e.close_price - e.open_price) / NULLIF(e.open_price, 0) AS entry_body_ret
FROM w4_signals s
CROSS JOIN (VALUES (1),(3),(5),(10)) AS d(delay_days)
JOIN td_index s_td ON s.trade_date = s_td.trade_date
JOIN td_index e_td ON e_td.td_idx = s_td.td_idx + d.delay_days
JOIN market_daily_price e ON e.trade_date = e_td.trade_date
    AND e.asset_code = s.asset_code
    AND e.asset_type = 'STOCK';

CREATE INDEX ON entry_candidates(signal_date, delay, daily_rank);
CREATE INDEX ON entry_candidates(asset_code, entry_date);

-- Apply confirmation filter + select best per (signal_date, delay, topN)
CREATE TEMP TABLE selected_trades AS
WITH confirmed AS (
    SELECT *,
        CASE WHEN signal_to_entry_ret >= -0.08
              AND entry_candle_loc >= 0.55
              AND entry_upper_shadow <= 0.12
              AND entry_body_ret >= -0.03
             THEN TRUE ELSE FALSE END AS confirmed
    FROM entry_candidates
),
ranked_confirmed AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY signal_date, delay ORDER BY daily_rank) AS confirmed_rank,
        ROW_NUMBER() OVER (PARTITION BY signal_date, delay ORDER BY
            CASE WHEN confirmed AND daily_rank <= 1 THEN daily_rank ELSE 9999 END) AS top1_rank,
        ROW_NUMBER() OVER (PARTITION BY signal_date, delay ORDER BY
            CASE WHEN confirmed AND daily_rank <= 3 THEN daily_rank ELSE 9999 END) AS top3_rank,
        ROW_NUMBER() OVER (PARTITION BY signal_date, delay ORDER BY
            CASE WHEN confirmed AND daily_rank <= 5 THEN daily_rank ELSE 9999 END) AS top5_rank,
        ROW_NUMBER() OVER (PARTITION BY signal_date, delay ORDER BY
            CASE WHEN confirmed AND daily_rank <= 10 THEN daily_rank ELSE 9999 END) AS top10_rank
    FROM confirmed
)
SELECT signal_date, asset_code, asset_name, daily_rank AS selected_rank,
       signal_close, delay, entry_date, entry_close,
       entry_candle_loc, entry_upper_shadow, signal_to_entry_ret,
       'top1' AS topn
FROM ranked_confirmed
WHERE top1_rank = 1 AND confirmed AND daily_rank <= 1
UNION ALL
SELECT signal_date, asset_code, asset_name, daily_rank AS selected_rank,
       signal_close, delay, entry_date, entry_close,
       entry_candle_loc, entry_upper_shadow, signal_to_entry_ret,
       'top3' AS topn
FROM ranked_confirmed
WHERE top3_rank = 1 AND confirmed AND daily_rank <= 3
UNION ALL
SELECT signal_date, asset_code, asset_name, daily_rank AS selected_rank,
       signal_close, delay, entry_date, entry_close,
       entry_candle_loc, entry_upper_shadow, signal_to_entry_ret,
       'top5' AS topn
FROM ranked_confirmed
WHERE top5_rank = 1 AND confirmed AND daily_rank <= 5
UNION ALL
SELECT signal_date, asset_code, asset_name, daily_rank AS selected_rank,
       signal_close, delay, entry_date, entry_close,
       entry_candle_loc, entry_upper_shadow, signal_to_entry_ret,
       'top10' AS topn
FROM ranked_confirmed
WHERE top10_rank = 1 AND confirmed AND daily_rank <= 10;

CREATE INDEX ON selected_trades(asset_code, entry_date, delay, topn);

-- Exit simulation: get all future prices up to 50 trading days
CREATE TEMP TABLE trade_exits AS
WITH future_prices AS (
    SELECT
        st.signal_date,
        st.asset_code,
        st.delay,
        st.topn,
        st.entry_date,
        st.entry_close AS ep,
        st.asset_name,
        st.selected_rank,
        f.trade_date AS future_date,
        f.close_price AS fc,
        f.high_price AS fh,
        f.low_price AS fl,
        td_f.td_idx - td_e.td_idx AS dh,
        MAX(f.close_price) OVER (
            PARTITION BY st.signal_date, st.asset_code, st.delay, st.topn
            ORDER BY td_f.td_idx
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS peak_close
    FROM selected_trades st
    JOIN td_index td_e ON st.entry_date = td_e.trade_date
    JOIN td_index td_f ON td_f.td_idx BETWEEN td_e.td_idx + 1 AND td_e.td_idx + 50
    JOIN market_daily_price f ON f.trade_date = td_f.trade_date
        AND f.asset_code = st.asset_code
        AND f.asset_type = 'STOCK'
),
with_exit_flags AS (
    SELECT *,
        CASE WHEN (fc / NULLIF(ep, 0)) - 1 <= -0.25 THEN TRUE ELSE FALSE END AS stop_loss,
        CASE WHEN dh <= 5 AND (fc / NULLIF(ep, 0)) - 1 <= -0.12 THEN TRUE ELSE FALSE END AS early_fail,
        CASE WHEN (peak_close / NULLIF(ep, 0)) - 1 >= 0.30
              AND (fc / NULLIF(peak_close, 0)) - 1 <= -0.30 THEN TRUE ELSE FALSE END AS trail_stop,
        CASE WHEN dh = 50 THEN TRUE ELSE FALSE END AS max_hold
    FROM future_prices
),
first_exits AS (
    SELECT DISTINCT ON (signal_date, asset_code, delay, topn)
        signal_date, asset_code, asset_name, delay, topn, selected_rank,
        entry_date, ep AS entry_price,
        future_date AS exit_date,
        fc AS exit_price,
        dh AS days_held,
        (fc / NULLIF(ep, 0)) - 1 AS gross_ret,
        CASE
            WHEN stop_loss THEN 'stop'
            WHEN early_fail THEN 'early_fail'
            WHEN trail_stop THEN 'trail'
            WHEN max_hold THEN 'maxhold'
        END AS exit_reason
    FROM with_exit_flags
    WHERE stop_loss OR early_fail OR trail_stop OR max_hold
    ORDER BY signal_date, asset_code, delay, topn, dh
)
SELECT *,
    gross_ret - 0.006 AS net_ret,
    DATE_TRUNC('month', entry_date)::date AS entry_month,
    CASE
        WHEN entry_date < '2022-05-01' THEN 'pre'
        WHEN entry_date < '2025-08-01' THEN 'train'
        ELSE 'post'
    END AS period,
    asset_code = '322510' AS is_jlk
FROM first_exits;

CREATE INDEX ON trade_exits(delay, topn, period, is_jlk);

-- ============================================================
-- OUTPUT 1: Full trade list CSV
-- ============================================================
\copy (
    SELECT
        signal_date, entry_date, exit_date,
        asset_code, asset_name,
        delay, topn, selected_rank,
        ROUND(entry_price::numeric, 0) AS entry_price,
        ROUND(exit_price::numeric, 0) AS exit_price,
        days_held, exit_reason,
        ROUND(gross_ret::numeric * 100, 2) AS gross_pct,
        ROUND(net_ret::numeric * 100, 2) AS net_pct,
        period, is_jlk, entry_month
    FROM trade_exits
    ORDER BY delay, topn, entry_date, asset_code
) TO 'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-extended-trades.csv' CSV HEADER;

-- ============================================================
-- OUTPUT 2: Monthly return aggregation for report
-- ============================================================
\copy (
    WITH monthly_rets AS (
        SELECT
            delay, topn, period, is_jlk, entry_month,
            SUM(net_ret) AS monthly_net_ret,
            COUNT(*) AS trades
        FROM trade_exits
        GROUP BY delay, topn, period, is_jlk, entry_month
    ),
    summary AS (
        SELECT
            delay, topn, period, is_jlk,
            ROUND(AVG(monthly_net_ret)::numeric * 100, 2) AS avg_monthly_pct,
            ROUND(SUM(monthly_net_ret)::numeric * 100, 2) AS total_ret_pct,
            ROUND(MIN(monthly_net_ret)::numeric * 100, 2) AS worst_month_pct,
            COUNT(DISTINCT entry_month) AS active_months,
            SUM(trades) AS total_trades,
            ROUND(AVG(CASE WHEN net_ret > 0 THEN 1.0 ELSE 0.0 END)::numeric * 100, 1) AS win_rate_pct
        FROM monthly_rets
        GROUP BY delay, topn, period, is_jlk
    )
    SELECT * FROM summary
    ORDER BY delay, topn, period, is_jlk
) TO 'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-sensitivity-summary.csv' CSV HEADER;

-- ============================================================
-- OUTPUT 3: Individual trade net returns (for win-rate by period)
-- ============================================================
\copy (
    SELECT
        delay, topn, period, is_jlk,
        COUNT(*) AS n_trades,
        ROUND(AVG(net_ret)::numeric * 100, 2) AS avg_trade_ret_pct,
        ROUND(SUM(net_ret)::numeric * 100, 2) AS sum_ret_pct,
        ROUND(MIN(net_ret)::numeric * 100, 2) AS min_ret_pct,
        ROUND(MAX(net_ret)::numeric * 100, 2) AS max_ret_pct,
        ROUND(AVG(CASE WHEN net_ret > 0 THEN 1.0 ELSE 0.0 END)::numeric * 100, 1) AS win_rate_pct,
        COUNT(CASE WHEN exit_reason = 'stop' THEN 1 END) AS n_stop,
        COUNT(CASE WHEN exit_reason = 'early_fail' THEN 1 END) AS n_early_fail,
        COUNT(CASE WHEN exit_reason = 'trail' THEN 1 END) AS n_trail,
        COUNT(CASE WHEN exit_reason = 'maxhold' THEN 1 END) AS n_maxhold
    FROM trade_exits
    GROUP BY delay, topn, period, is_jlk
    ORDER BY delay, topn, period, is_jlk
) TO 'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-trade-stats.csv' CSV HEADER;
