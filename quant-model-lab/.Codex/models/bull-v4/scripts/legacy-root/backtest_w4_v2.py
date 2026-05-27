"""
W4 Sensitivity V2 - 수정 적용 재테스트
수정사항:
1. entry confirmation 강화: body_ret >= 0%, candle_loc >= 0.65, shadow <= 0.05, drawdown >= -5%
2. KOSPI regime 필터: KOSPI close > KOSPI ma60
3. early fail 강화: -8% / 3일
4. 비교용 base(original) vs improved 동시 출력
"""

import psycopg2
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

DB = dict(host='localhost', port=5432, dbname='marketpulse', user='postgres', password='postgreskh')

PRE_START   = '2015-01-01'
PRE_END     = '2022-04-30'
TRAIN_START = '2022-05-01'
TRAIN_END   = '2025-07-31'
POST_START  = '2025-08-01'
POST_END    = '2026-05-20'
COST = 0.003

print("[1/6] 데이터 로드 중...")
conn = psycopg2.connect(**DB)
df_raw = pd.read_sql("""
    SELECT asset_code, asset_name, asset_type, trade_date,
           open_price, high_price, low_price, close_price, volume
    FROM market_daily_price
    WHERE trade_date >= %s AND trade_date <= %s
      AND close_price > 0 AND volume > 0
    ORDER BY asset_code, trade_date
""", conn, params=[PRE_START, POST_END], parse_dates=['trade_date'])
conn.close()
print(f"  로드: {len(df_raw):,} rows")

print("[2/6] 피처 계산 중...")
df = df_raw.copy()
df = df.sort_values(['asset_code', 'trade_date']).reset_index(drop=True)
g = df.groupby('asset_code', group_keys=False)

df['ma20']  = g['close_price'].transform(lambda x: x.rolling(20, min_periods=20).mean())
df['ma60']  = g['close_price'].transform(lambda x: x.rolling(60, min_periods=60).mean())
df['avg_vol20'] = g['volume'].transform(lambda x: x.rolling(20, min_periods=20).mean())
df['ma20_slope5'] = g['ma20'].transform(lambda x: (x - x.shift(5)) / x.shift(5))
df['ma60_slope5'] = g['ma60'].transform(lambda x: (x - x.shift(5)) / x.shift(5))
df['ret60']  = g['close_price'].transform(lambda x: (x - x.shift(60)) / x.shift(60))
df['max_high20'] = g['high_price'].transform(lambda x: x.rolling(20, min_periods=20).max())
df['min_low20']  = g['low_price'].transform(lambda x: x.rolling(20, min_periods=20).min())
df['range20'] = (df['max_high20'] - df['min_low20']) / df['close_price']
df['ma60_dist'] = (df['close_price'] - df['ma60']) / df['ma60']

hl = (df['high_price'] - df['low_price']).clip(lower=1e-6)
df['candle_loc'] = (df['close_price'] - df['low_price']) / hl
df['upper_shadow'] = (df['high_price'] - df[['open_price','close_price']].max(axis=1)) / hl
df['body_ret'] = (df['close_price'] - df['open_price']) / df['open_price'].clip(lower=1e-6)
df['vol_exp'] = df['volume'] / df['avg_vol20'].clip(lower=1e-6)
df['trade_amount'] = df['close_price'] * df['volume']

# KOSPI 시장 regime
stocks = df[df['asset_type'] == 'STOCK'].copy()
kospi = df[df['asset_code'] == 'K001'].copy()  # KOSPI 인덱스
if len(kospi) == 0:
    # KOSPI가 없으면 KOSDAQ으로
    kospi = df[df['asset_code'].isin(['K200','KOSPI','KSPI']) | (df['asset_type'] == 'INDEX')].copy()

if len(kospi) > 0:
    kospi = kospi.sort_values('trade_date')
    kospi['kospi_ma60'] = kospi['close_price'].rolling(60, min_periods=60).mean()
    kospi['regime_ok'] = kospi['close_price'] > kospi['kospi_ma60']
    regime_map = dict(zip(kospi['trade_date'], kospi['regime_ok']))
    print(f"  KOSPI regime 데이터: {len(kospi)} rows")
else:
    regime_map = {}
    print("  KOSPI 데이터 없음 - regime 필터 미적용")

df = stocks.dropna(subset=['ma20','ma60','ret60','range20','vol_exp'])
print(f"  피처 계산 완료: {len(df):,} stock rows")

print("[3/6] W4 후보 필터링...")
cond_w4 = (
    (df['range20'] >= 0.25) &
    (df['range20'] <= 0.55) &
    (df['ret60'] >= 0.20) &
    (df['ma60_dist'] > 0.05) &
    (df['close_price'] > df['ma20']) &
    (df['close_price'] > df['ma60']) &
    (df['vol_exp'] <= 3.0) &
    (df['ma20_slope5'] > 0) &
    (df['ma60_slope5'] > 0) &
    (df['candle_loc'] >= 0.45) &
    (df['upper_shadow'] <= 0.08) &
    (df['trade_amount'] >= 500_000_000)
)
candidates = df[cond_w4].copy()
candidates['score'] = candidates['range20'] + candidates['ret60'] + candidates['ma60_dist']
print(f"  W4 후보: {len(candidates):,} rows")

print("[4/6] 거래일 인덱스 구축...")
df_indexed = df.set_index(['asset_code', 'trade_date'])
all_dates = sorted(df['trade_date'].unique())
date_to_idx = {d: i for i, d in enumerate(all_dates)}
asset_dates = df.groupby('asset_code')['trade_date'].apply(sorted).to_dict()

def get_nth_day(code, sig_date, n):
    dates = asset_dates.get(code, [])
    sig_pd = pd.Timestamp(sig_date)
    future = [d for d in dates if d > sig_pd]
    return future[n-1] if len(future) >= n else None

def get_future_prices(code, start_date, n_days):
    dates = asset_dates.get(code, [])
    start_pd = pd.Timestamp(start_date)
    future = [d for d in dates if d >= start_pd][:n_days+1]
    rows = []
    for d in future:
        try:
            r = df_indexed.loc[(code, d)]
            rows.append({'trade_date': d, 'open': float(r['open_price']),
                         'high': float(r['high_price']), 'low': float(r['low_price']),
                         'close': float(r['close_price'])})
        except: pass
    return pd.DataFrame(rows) if rows else None

def simulate_exit(prices, entry_price, stop=-0.25, early_fail=-0.12, early_days=5,
                  trail_start=0.30, trail_pct=0.30, max_hold=50):
    if prices is None or len(prices) < 2:
        return None, None, 'NO_DATA'
    entry_actual = float(prices.iloc[0]['open'])
    if entry_actual <= 0:
        entry_actual = entry_price
    peak = entry_actual
    for i, (_, row) in enumerate(prices.iloc[1:].iterrows()):
        lo, hi, cl = float(row['low']), float(row['high']), float(row['close'])
        ret_low = (lo - entry_actual) / entry_actual
        if i < early_days and ret_low <= early_fail:
            return row['trade_date'], (entry_actual*(1+early_fail) - entry_actual)/entry_actual - COST, 'EARLY_FAIL'
        if ret_low <= stop:
            return row['trade_date'], stop - COST, 'STOP'
        peak = max(peak, hi)
        if (peak - entry_actual)/entry_actual >= trail_start:
            if (cl - peak)/peak <= -trail_pct:
                return row['trade_date'], (cl - entry_actual)/entry_actual - COST, 'TRAIL'
        if i >= max_hold - 1:
            return row['trade_date'], (cl - entry_actual)/entry_actual - COST, 'MAX'
    last = prices.iloc[-1]
    cl = float(last['close'])
    return last['trade_date'], (cl - entry_actual)/entry_actual - COST, 'MAX'

def run_backtest(delay=5, top_n=10,
                 entry_drawdown=-0.08, entry_loc=0.55, entry_shadow=0.12, entry_body=-0.03,
                 stop=-0.25, early_fail=-0.12, early_days=5,
                 trail_start=0.30, trail_pct=0.30, max_hold=50,
                 monthly_loss_stop=-0.15, use_regime=False,
                 label=''):
    trades = []
    signal_dates = sorted(candidates['trade_date'].unique())
    cadence_dates = []
    prev_idx = None
    for d in signal_dates:
        ci = date_to_idx.get(d)
        if ci is None: continue
        if prev_idx is None or ci - prev_idx >= 5:
            cadence_dates.append(d)
            prev_idx = ci

    monthly_pnl = {}
    open_trade_end = None

    for sig_date in cadence_dates:
        sig_pd = pd.Timestamp(sig_date)
        ym = (sig_pd.year, sig_pd.month)
        if monthly_pnl.get(ym, 0) <= monthly_loss_stop:
            continue
        if open_trade_end is not None and sig_pd <= open_trade_end:
            continue
        if use_regime and regime_map:
            r_ok = regime_map.get(sig_pd, True)
            if not r_ok:
                continue

        day_cands = candidates[candidates['trade_date'] == sig_pd]
        if len(day_cands) == 0:
            continue
        day_cands = day_cands.sort_values('score', ascending=False).head(top_n)

        selected = None
        for _, cand in day_cands.iterrows():
            code = cand['asset_code']
            entry_date = get_nth_day(code, sig_pd, delay)
            if entry_date is None: continue
            try:
                er = df_indexed.loc[(code, entry_date)]
            except: continue
            ec = float(er['close_price'])
            sc = float(cand['close_price'])
            if (ec - sc)/sc < entry_drawdown: continue
            eloc = float(er['candle_loc'])
            eshad = float(er['upper_shadow'])
            ebod = float(er['body_ret'])
            if eloc < entry_loc: continue
            if eshad > entry_shadow: continue
            if ebod < entry_body: continue
            selected = (cand, entry_date)
            break

        if selected is None: continue
        cand, entry_date = selected
        code = cand['asset_code']
        next_day = get_nth_day(code, entry_date, 1)
        if next_day is None: continue
        future = get_future_prices(code, next_day, max_hold+1)
        if future is None or len(future) < 2: continue
        ep = float(df_indexed.loc[(code, next_day)]['open_price'])
        if ep <= 0: continue
        exit_date, ret, reason = simulate_exit(future, ep, stop, early_fail, early_days, trail_start, trail_pct, max_hold)
        if exit_date is None: continue

        exit_ym = (pd.Timestamp(exit_date).year, pd.Timestamp(exit_date).month)
        monthly_pnl[exit_ym] = monthly_pnl.get(exit_ym, 0) + ret
        open_trade_end = pd.Timestamp(exit_date)

        period = ('pre' if sig_pd <= pd.Timestamp(PRE_END)
                  else ('train' if sig_pd <= pd.Timestamp(TRAIN_END) else 'post'))
        trades.append({'period': period, 'signal_date': sig_date, 'asset_code': code,
                       'asset_name': cand['asset_name'], 'entry_date': entry_date,
                       'exit_date': exit_date, 'ret': ret, 'reason': reason})

    return pd.DataFrame(trades)

def summarize(trades_df, label=''):
    print(f"\n=== {label} ===")
    if trades_df is None or len(trades_df) == 0:
        print("  거래 없음"); return
    for period in ['pre','train','post']:
        sub = trades_df[trades_df['period']==period]
        if len(sub) == 0:
            print(f"  {period}: 0 trades"); continue
        sub2 = sub.copy()
        sub2['ym'] = pd.to_datetime(sub2['exit_date']).dt.to_period('M')
        monthly = sub2.groupby('ym')['ret'].sum()
        avg_m = monthly.mean()*100
        total = ((1+sub['ret']).prod()-1)*100
        worst = monthly.min()*100
        n = len(sub)
        win = (sub['ret']>0).mean()*100
        reasons = sub['reason'].value_counts().to_dict()
        print(f"  {period}: avg={avg_m:.2f}% total={total:.2f}% worst={worst:.2f}% N={n} win={win:.1f}% | {reasons}")

print("\n[5/6] 백테스트 실행 중...\n")

# --- 비교 1: 원본 설정 ---
t_base = run_backtest(delay=5, top_n=10,
    entry_drawdown=-0.08, entry_loc=0.55, entry_shadow=0.12, entry_body=-0.03,
    stop=-0.25, early_fail=-0.12, early_days=5, label='BASE')
summarize(t_base, "BASE (원본 설정)")

# --- 비교 2: 강화된 entry confirmation ---
t_v2 = run_backtest(delay=5, top_n=10,
    entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05, entry_body=0.00,
    stop=-0.25, early_fail=-0.08, early_days=3, label='V2_TIGHT')
summarize(t_v2, "V2 - entry 강화 (loc>=0.65, shadow<=0.05, body>=0%, drawdown>=-5%, fail=-8%/3d)")

# --- 비교 3: regime 필터 추가 ---
t_v3 = run_backtest(delay=5, top_n=10,
    entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05, entry_body=0.00,
    stop=-0.25, early_fail=-0.08, early_days=3,
    use_regime=True, label='V3_REGIME')
summarize(t_v3, "V3 - V2 + KOSPI regime 필터")

# --- 비교 4: top1 strict ---
t_v4 = run_backtest(delay=5, top_n=1,
    entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05, entry_body=0.00,
    stop=-0.25, early_fail=-0.08, early_days=3, label='V4_TOP1')
summarize(t_v4, "V4 - top1 only + entry 강화")

# --- 비교 5: delay 단축 (1일) + entry 강화 ---
t_v5 = run_backtest(delay=1, top_n=10,
    entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05, entry_body=0.00,
    stop=-0.25, early_fail=-0.08, early_days=3, label='V5_DELAY1')
summarize(t_v5, "V5 - delay=1d + entry 강화")

print("\n[6/6] 결과 저장...")
results = {
    'base': t_base, 'v2_tight': t_v2, 'v3_regime': t_v3, 'v4_top1': t_v4, 'v5_delay1': t_v5
}

lines = ["# W4 Backtest V2 - 수정 후 재테스트\n\n",
         f"date: 2026-05-26\npre: {PRE_START}~{PRE_END}\ntrain: {TRAIN_START}~{TRAIN_END}\npost: {POST_START}~{POST_END}\n\n",
         "| variant | period | avg monthly | total | worst | N | win |\n|---|---|---:|---:|---:|---:|---:|\n"]

def row(df, period, label):
    sub = df[df['period']==period] if df is not None and len(df) > 0 else pd.DataFrame()
    if len(sub) == 0:
        return f"| {label} | {period} | - | - | - | 0 | - |\n"
    sub2 = sub.copy()
    sub2['ym'] = pd.to_datetime(sub2['exit_date']).dt.to_period('M')
    monthly = sub2.groupby('ym')['ret'].sum()
    return (f"| {label} | {period} | {monthly.mean()*100:.2f}% | {((1+sub['ret']).prod()-1)*100:.2f}% | "
            f"{monthly.min()*100:.2f}% | {len(sub)} | {(sub['ret']>0).mean()*100:.1f}% |\n")

for lbl, df_ in results.items():
    for p in ['pre','train','post']:
        lines.append(row(df_, p, lbl))

with open(r'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-v2-retest.md', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("완료.")
