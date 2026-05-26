-- W4 Extended Sensitivity Analysis
-- Periods: pre=2015-01-01~2022-04-30, train=2022-05-01~2025-07-31, post=2025-08-01~2026-05-20
-- Entry delay sensitivity: 1, 3, 5, 10 trading days
-- Top fallback sensitivity: top1, top3, top5, top10
-- Exclude 322510 (제이엘케이) sensitivity

-- Step 1: Build trading day index
WITH trading_days AS (
    SELECT DISTINCT trade_date,
           ROW_NUMBER() OVER (ORDER BY trade_date) AS td_idx
    FROM market_daily_price
    WHERE asset_type = 'STOCK'
      AND trade_date >= '2013-01-01'  -- need lookback for 2015 signals
),

-- Step 2: Compute indicators per stock per day
base_indicators AS (
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
        -- MA20, MA60
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS ma20,
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS ma60,
        -- Range20: (high-low)/close rolling 20-day average
        AVG((m.high_price - m.low_price) / NULLIF(m.close_price, 0)) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS range20,
        -- ret60: 60-day return
        (m.close_price / NULLIF(LAG(m.close_price, 60) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date), 0)) - 1 AS ret60,
        -- volume avg20
        AVG(m.volume) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS vol_avg20,
        -- MA20 slope (5-day): (ma20 - ma20 5 days ago) / ma20 5 days ago
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 14 PRECEDING AND 4 PRECEDING) AS ma20_5ago,
        -- MA60 slope (5-day)
        AVG(m.close_price) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 64 PRECEDING AND 4 PRECEDING) AS ma60_5ago,
        -- Candle location: (close - low) / (high - low)
        CASE WHEN (m.high_price - m.low_price) > 0
             THEN (m.close_price - m.low_price) / (m.high_price - m.low_price)
             ELSE 0.5 END AS candle_location,
        -- Upper shadow: (high - close) / (high - low)
        CASE WHEN (m.high_price - m.low_price) > 0
             THEN (m.high_price - m.close_price) / (m.high_price - m.low_price)
             ELSE 0 END AS upper_shadow,
        -- Count rows for this asset to filter sufficient history
        COUNT(*) OVER (PARTITION BY m.asset_code ORDER BY m.trade_date ROWS BETWEEN 59 PRECEDING AND CURRENT ROW) AS hist60
    FROM market_daily_price m
    JOIN trading_days td ON m.trade_date = td.trade_date
    WHERE m.asset_type = 'STOCK'
      AND m.close_price > 0
),

-- Step 3: Add derived indicators
indicators AS (
    SELECT *,
        -- MA60 distance: (close - ma60) / ma60
        (close_price / NULLIF(ma60, 0)) - 1 AS ma60_dist,
        -- Volume expansion: today volume / avg20 volume
        volume::numeric / NULLIF(vol_avg20, 0) AS volume_expansion,
        -- MA20 slope 5-day
        CASE WHEN ma20_5ago > 0 THEN (ma20 - ma20_5ago) / ma20_5ago ELSE NULL END AS ma20_slope5,
        -- MA60 slope 5-day
        CASE WHEN ma60_5ago > 0 THEN (ma60 - ma60_5ago) / ma60_5ago ELSE NULL END AS ma60_slope5
    FROM base_indicators
    WHERE hist60 >= 60  -- need at least 60 bars for valid indicators
),

-- Step 4: W4 filter signals
w4_signals AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY trade_date ORDER BY ret60 DESC, range20 DESC) AS daily_rank
    FROM indicators
    WHERE trade_date >= '2015-01-01'
      AND trade_date <= '2026-05-20'
      AND range20 >= 0.25
      AND ret60 >= 0.20
      AND ma60_dist > 0.05
      AND ma20 > ma60           -- proxy for above cloud
      AND range20 <= 0.55
      AND volume_expansion <= 3.0
      AND ma20_slope5 > 0
      AND ma60_slope5 > 0
      AND candle_location >= 0.45
      AND upper_shadow <= 0.08
),

-- Step 5: For each signal, get entry price at N trading days later
-- We need to join with future prices
-- Build entry candidates for delay=1,3,5,10
entry_delay_1 AS (
    SELECT
        s.trade_date AS signal_date,
        s.asset_code,
        s.asset_name,
        s.daily_rank,
        s.close_price AS signal_close,
        e.trade_date AS entry_date,
        e.open_price AS entry_price,
        e.high_price AS entry_high,
        e.low_price AS entry_low,
        e.close_price AS entry_close,
        -- Entry candle confirmation checks
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.close_price - e.low_price) / (e.high_price - e.low_price)
             ELSE 0.5 END AS entry_candle_loc,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.high_price - e.close_price) / (e.high_price - e.low_price)
             ELSE 0 END AS entry_upper_shadow,
        (e.close_price / NULLIF(s.close_price, 0)) - 1 AS signal_to_entry_drawdown,
        (e.close_price - e.open_price) / NULLIF(e.open_price, 0) AS entry_body_return,
        1 AS delay
    FROM w4_signals s
    JOIN trading_days td_s ON s.trade_date = td_s.trade_date
    JOIN trading_days td_e ON td_e.td_idx = td_s.td_idx + 1
    JOIN market_daily_price e ON e.trade_date = td_e.trade_date AND e.asset_code = s.asset_code AND e.asset_type = 'STOCK'
),

entry_delay_3 AS (
    SELECT
        s.trade_date AS signal_date,
        s.asset_code,
        s.asset_name,
        s.daily_rank,
        s.close_price AS signal_close,
        e.trade_date AS entry_date,
        e.open_price AS entry_price,
        e.high_price AS entry_high,
        e.low_price AS entry_low,
        e.close_price AS entry_close,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.close_price - e.low_price) / (e.high_price - e.low_price)
             ELSE 0.5 END AS entry_candle_loc,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.high_price - e.close_price) / (e.high_price - e.low_price)
             ELSE 0 END AS entry_upper_shadow,
        (e.close_price / NULLIF(s.close_price, 0)) - 1 AS signal_to_entry_drawdown,
        (e.close_price - e.open_price) / NULLIF(e.open_price, 0) AS entry_body_return,
        3 AS delay
    FROM w4_signals s
    JOIN trading_days td_s ON s.trade_date = td_s.trade_date
    JOIN trading_days td_e ON td_e.td_idx = td_s.td_idx + 3
    JOIN market_daily_price e ON e.trade_date = td_e.trade_date AND e.asset_code = s.asset_code AND e.asset_type = 'STOCK'
),

entry_delay_5 AS (
    SELECT
        s.trade_date AS signal_date,
        s.asset_code,
        s.asset_name,
        s.daily_rank,
        s.close_price AS signal_close,
        e.trade_date AS entry_date,
        e.open_price AS entry_price,
        e.high_price AS entry_high,
        e.low_price AS entry_low,
        e.close_price AS entry_close,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.close_price - e.low_price) / (e.high_price - e.low_price)
             ELSE 0.5 END AS entry_candle_loc,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.high_price - e.close_price) / (e.high_price - e.low_price)
             ELSE 0 END AS entry_upper_shadow,
        (e.close_price / NULLIF(s.close_price, 0)) - 1 AS signal_to_entry_drawdown,
        (e.close_price - e.open_price) / NULLIF(e.open_price, 0) AS entry_body_return,
        5 AS delay
    FROM w4_signals s
    JOIN trading_days td_s ON s.trade_date = td_s.trade_date
    JOIN trading_days td_e ON td_e.td_idx = td_s.td_idx + 5
    JOIN market_daily_price e ON e.trade_date = td_e.trade_date AND e.asset_code = s.asset_code AND e.asset_type = 'STOCK'
),

entry_delay_10 AS (
    SELECT
        s.trade_date AS signal_date,
        s.asset_code,
        s.asset_name,
        s.daily_rank,
        s.close_price AS signal_close,
        e.trade_date AS entry_date,
        e.open_price AS entry_price,
        e.high_price AS entry_high,
        e.low_price AS entry_low,
        e.close_price AS entry_close,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.close_price - e.low_price) / (e.high_price - e.low_price)
             ELSE 0.5 END AS entry_candle_loc,
        CASE WHEN (e.high_price - e.low_price) > 0
             THEN (e.high_price - e.close_price) / (e.high_price - e.low_price)
             ELSE 0 END AS entry_upper_shadow,
        (e.close_price / NULLIF(s.close_price, 0)) - 1 AS signal_to_entry_drawdown,
        (e.close_price - e.open_price) / NULLIF(e.open_price, 0) AS entry_body_return,
        10 AS delay
    FROM w4_signals s
    JOIN trading_days td_s ON s.trade_date = td_s.trade_date
    JOIN trading_days td_e ON td_e.td_idx = td_s.td_idx + 10
    JOIN market_daily_price e ON e.trade_date = td_e.trade_date AND e.asset_code = s.asset_code AND e.asset_type = 'STOCK'
),

-- Combine all delays
all_entry_candidates AS (
    SELECT * FROM entry_delay_1
    UNION ALL
    SELECT * FROM entry_delay_3
    UNION ALL
    SELECT * FROM entry_delay_5
    UNION ALL
    SELECT * FROM entry_delay_10
),

-- Step 6: Apply entry confirmation filter
confirmed_entries AS (
    SELECT *,
        CASE WHEN signal_to_entry_drawdown >= -0.08
              AND entry_candle_loc >= 0.55
              AND entry_upper_shadow <= 0.12
              AND entry_body_return >= -0.03
             THEN TRUE ELSE FALSE END AS confirmation_passed
    FROM all_entry_candidates
),

-- Step 7: Select top-N per signal_date+delay combination
-- For each (signal_date, delay), pick first confirmed candidate up to rank N
-- top1: rank=1 only if confirmed
-- top3: first confirmed within rank 1-3
-- top5: first confirmed within rank 1-5
-- top10: first confirmed within rank 1-10
top_selected AS (
    SELECT *,
        -- For topN selection: is this candidate selectable for each top-N?
        CASE WHEN confirmation_passed AND daily_rank <= 1 THEN 1 ELSE 0 END AS in_top1,
        CASE WHEN confirmation_passed AND daily_rank <= 3 THEN 1 ELSE 0 END AS in_top3,
        CASE WHEN confirmation_passed AND daily_rank <= 5 THEN 1 ELSE 0 END AS in_top5,
        CASE WHEN confirmation_passed AND daily_rank <= 10 THEN 1 ELSE 0 END AS in_top10
    FROM confirmed_entries
),

-- Pick the best (lowest rank) confirmed entry per signal_date+delay for each topN
best_top1 AS (
    SELECT DISTINCT ON (signal_date, delay)
        *, 'top1' AS topn
    FROM top_selected
    WHERE in_top1 = 1
    ORDER BY signal_date, delay, daily_rank
),
best_top3 AS (
    SELECT DISTINCT ON (signal_date, delay)
        *, 'top3' AS topn
    FROM top_selected
    WHERE in_top3 = 1
    ORDER BY signal_date, delay, daily_rank
),
best_top5 AS (
    SELECT DISTINCT ON (signal_date, delay)
        *, 'top5' AS topn
    FROM top_selected
    WHERE in_top5 = 1
    ORDER BY signal_date, delay, daily_rank
),
best_top10 AS (
    SELECT DISTINCT ON (signal_date, delay)
        *, 'top10' AS topn
    FROM top_selected
    WHERE in_top10 = 1
    ORDER BY signal_date, delay, daily_rank
),

-- Combine selected trades
selected_trades AS (
    SELECT * FROM best_top1
    UNION ALL
    SELECT * FROM best_top3
    UNION ALL
    SELECT * FROM best_top5
    UNION ALL
    SELECT * FROM best_top10
),

-- Step 8: Exit simulation
-- For each trade, get all future prices up to 50 trading days
-- Use entry close as entry price (EOD execution)
-- Costs: 0.3% buy + 0.3% sell = 0.6% round trip
trade_with_future AS (
    SELECT
        st.signal_date,
        st.asset_code,
        st.asset_name,
        st.entry_date,
        st.entry_close AS entry_price_used,  -- entry at close of entry day
        st.delay,
        st.topn,
        st.daily_rank AS selected_rank,
        td_e.td_idx AS entry_td_idx,
        f.trade_date AS future_date,
        f.close_price AS future_close,
        f.high_price AS future_high,
        f.low_price AS future_low,
        td_f.td_idx - td_e.td_idx AS days_held,
        -- Gross return from entry
        (f.close_price / NULLIF(st.entry_close, 0)) - 1 AS gross_ret,
        -- Running max close from entry (for trailing stop)
        MAX(f.close_price) OVER (
            PARTITION BY st.signal_date, st.asset_code, st.delay, st.topn
            ORDER BY td_f.td_idx
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_max_close
    FROM selected_trades st
    JOIN trading_days td_e ON st.entry_date = td_e.trade_date
    JOIN trading_days td_f ON td_f.td_idx BETWEEN td_e.td_idx + 1 AND td_e.td_idx + 50
    JOIN market_daily_price f ON f.trade_date = td_f.trade_date AND f.asset_code = st.asset_code AND f.asset_type = 'STOCK'
),

-- Step 9: Determine exit for each future day
exit_candidates AS (
    SELECT *,
        -- Stop loss: -25% from entry
        CASE WHEN gross_ret <= -0.25 THEN TRUE ELSE FALSE END AS stop_triggered,
        -- Early fail: -12% within first 5 days
        CASE WHEN days_held <= 5 AND gross_ret <= -0.12 THEN TRUE ELSE FALSE END AS early_fail_triggered,
        -- Trailing stop: after 30% open profit, trail 30% from peak
        CASE WHEN running_max_close / NULLIF(entry_price_used, 0) - 1 >= 0.30
              AND future_close / NULLIF(running_max_close, 0) - 1 <= -0.30
             THEN TRUE ELSE FALSE END AS trail_triggered,
        -- Max hold: 50 days
        CASE WHEN days_held = 50 THEN TRUE ELSE FALSE END AS maxhold_triggered
    FROM trade_with_future
),

-- Step 10: Find first exit day per trade
first_exit AS (
    SELECT DISTINCT ON (signal_date, asset_code, delay, topn)
        signal_date,
        asset_code,
        asset_name,
        entry_date,
        entry_price_used,
        delay,
        topn,
        selected_rank,
        future_date AS exit_date,
        future_close AS exit_price,
        days_held,
        gross_ret,
        CASE
            WHEN stop_triggered THEN 'stop'
            WHEN early_fail_triggered THEN 'early_fail'
            WHEN trail_triggered THEN 'trail'
            WHEN maxhold_triggered THEN 'maxhold'
            ELSE 'other'
        END AS exit_reason
    FROM exit_candidates
    WHERE stop_triggered OR early_fail_triggered OR trail_triggered OR maxhold_triggered
    ORDER BY signal_date, asset_code, delay, topn, days_held
),

-- Step 11: Net return after costs (0.6% round trip)
trade_returns AS (
    SELECT *,
        gross_ret - 0.006 AS net_ret,
        DATE_TRUNC('month', entry_date)::date AS entry_month,
        CASE
            WHEN entry_date >= '2015-01-01' AND entry_date < '2022-05-01' THEN 'pre'
            WHEN entry_date >= '2022-05-01' AND entry_date < '2025-08-01' THEN 'train'
            WHEN entry_date >= '2025-08-01' THEN 'post'
        END AS period,
        CASE WHEN asset_code = '322510' THEN TRUE ELSE FALSE END AS is_jlk
    FROM first_exit
    WHERE entry_date >= '2015-01-01'
)

-- Output full trade list
SELECT
    signal_date,
    entry_date,
    exit_date,
    asset_code,
    asset_name,
    delay,
    topn,
    selected_rank,
    entry_price_used,
    exit_price,
    days_held,
    exit_reason,
    ROUND(gross_ret::numeric * 100, 2) AS gross_ret_pct,
    ROUND(net_ret::numeric * 100, 2) AS net_ret_pct,
    period,
    is_jlk,
    entry_month
FROM trade_returns
ORDER BY delay, topn, entry_date, asset_code;
