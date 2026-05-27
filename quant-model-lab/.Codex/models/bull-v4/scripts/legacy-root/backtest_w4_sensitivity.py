"""
W4 Entry Confirmation Extended Backtest & Sensitivity Test
- Period: 2015-01-01 ~ 2026-05-20 (full available)
- pre: 2015-01-01 ~ 2022-04-30
- train: 2022-05-01 ~ 2025-07-31
- post: 2025-08-01 ~ 2026-05-20
- Tests: delay sensitivity (1/3/5/10d), top fallback (1/3/5/10), 제이엘케이 제외 재계산
"""

import psycopg2
import pandas as pd
import numpy as np
from datetime import date, timedelta
import warnings
warnings.filterwarnings('ignore')

DB = dict(host='localhost', port=5432, dbname='marketpulse', user='postgres', password='postgreskh')

PRE_START   = '2015-01-01'
PRE_END     = '2022-04-30'
TRAIN_START = '2022-05-01'
TRAIN_END   = '2025-07-31'
POST_START  = '2025-08-01'
POST_END    = '2026-05-20'

COST = 0.003  # 0.3% per trade

print("[1/7] DB 연결 및 원시 데이터 로드 중...")
conn = psycopg2.connect(**DB)
df_raw = pd.read_sql("""
    SELECT asset_code, asset_name, trade_date, open_price, high_price, low_price, close_price, volume
    FROM market_daily_price
    WHERE asset_type = 'STOCK'
      AND trade_date >= %s
      AND trade_date <= %s
      AND close_price > 0
      AND volume > 0
    ORDER BY asset_code, trade_date
""", conn, params=[PRE_START, POST_END], parse_dates=['trade_date'])
conn.close()
print(f"  로드 완료: {len(df_raw):,} rows, {df_raw['asset_code'].nunique()} 종목")

print("[2/7] 피처 계산 중 (window functions)...")
df = df_raw.copy()
df = df.sort_values(['asset_code', 'trade_date']).reset_index(drop=True)

g = df.groupby('asset_code', group_keys=False)

# 이동평균
df['ma20']  = g['close_price'].transform(lambda x: x.rolling(20, min_periods=20).mean())
df['ma60']  = g['close_price'].transform(lambda x: x.rolling(60, min_periods=60).mean())
df['ma120'] = g['close_price'].transform(lambda x: x.rolling(120, min_periods=120).mean())
df['avg_vol20'] = g['volume'].transform(lambda x: x.rolling(20, min_periods=20).mean())

# 슬로프 (5일 전 대비)
df['ma20_slope5'] = g['ma20'].transform(lambda x: (x - x.shift(5)) / x.shift(5))
df['ma60_slope5'] = g['ma60'].transform(lambda x: (x - x.shift(5)) / x.shift(5))

# 수익률
df['ret20']  = g['close_price'].transform(lambda x: (x - x.shift(20)) / x.shift(20))
df['ret60']  = g['close_price'].transform(lambda x: (x - x.shift(60)) / x.shift(60))

# range20: 최근 20일 (고가 최대 - 저가 최소) / 종가
df['max_high20'] = g['high_price'].transform(lambda x: x.rolling(20, min_periods=20).max())
df['min_low20']  = g['low_price'].transform(lambda x: x.rolling(20, min_periods=20).min())
df['range20'] = (df['max_high20'] - df['min_low20']) / df['close_price']

# high60_ratio: 종가 / 60일 최고가
df['high60'] = g['high_price'].transform(lambda x: x.rolling(60, min_periods=60).max())
df['high60_ratio'] = df['close_price'] / df['high60']

# ma60_dist
df['ma60_dist'] = (df['close_price'] - df['ma60']) / df['ma60']

# candle_location: (종가 - 저가) / (고가 - 저가)
hl = df['high_price'] - df['low_price']
df['candle_loc'] = np.where(hl > 0, (df['close_price'] - df['low_price']) / hl, 0.5)

# upper_shadow: (고가 - max(시가,종가)) / (고가 - 저가)
df['upper_shadow'] = np.where(hl > 0,
    (df['high_price'] - df[['open_price','close_price']].max(axis=1)) / hl, 0)

# volume_expansion
df['vol_exp'] = df['volume'] / df['avg_vol20']

# 거래일 인덱스
df['tdate_idx'] = df.groupby('asset_code').cumcount()

df = df.dropna(subset=['ma20','ma60','ma120','ret20','ret60','range20','vol_exp'])
print(f"  피처 계산 완료: {len(df):,} rows")

print("[3/7] W4 후보 필터링 중...")
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
    (df['volume'] * df['close_price'] >= 500_000_000)  # 거래대금 5억 이상
)
candidates = df[cond_w4].copy()
print(f"  W4 후보: {len(candidates):,} rows, {candidates['trade_date'].nunique()} 시그널 날짜")

# 점수: range20 + ret60 + ma60_dist (단순 합산)
candidates['score'] = candidates['range20'] + candidates['ret60'] + candidates['ma60_dist']

# 거래일 리스트 (asset별 날짜 인덱스 lookup)
print("[4/7] 거래일 인덱스 구축 중...")
# 전체 거래일 목록
all_dates = sorted(df['trade_date'].unique())
date_to_idx = {d: i for i, d in enumerate(all_dates)}
idx_to_date = {i: d for d, i in date_to_idx.items()}

# asset별 거래일 인덱스
asset_dates = df.groupby('asset_code')['trade_date'].apply(sorted).to_dict()

# 빠른 조회용: (asset_code, trade_date) -> 해당 asset의 몇 번째 거래일
asset_date_rank = {}
for code, dates in asset_dates.items():
    for rank, d in enumerate(dates):
        asset_date_rank[(code, d)] = rank

# 피처 lookup용 dict
feat_cols = ['open_price','high_price','low_price','close_price','candle_loc','upper_shadow','ret20','ret60','range20','ma60_dist','vol_exp','score']
df_indexed = df.set_index(['asset_code', 'trade_date'])

def get_nth_trading_day(code, signal_date, n):
    """code의 signal_date 이후 n번째 거래일 반환"""
    dates = asset_dates.get(code, [])
    sig_pd = pd.Timestamp(signal_date)
    # 시그널 날짜 이후 날짜들
    future = [d for d in dates if d > sig_pd]
    if len(future) >= n:
        return future[n - 1]
    return None

def get_future_prices(code, entry_date, max_hold):
    """entry_date 이후 max_hold 거래일간 일별 데이터 반환"""
    dates = asset_dates.get(code, [])
    entry_pd = pd.Timestamp(entry_date)
    future = [d for d in dates if d >= entry_pd][:max_hold + 1]
    if len(future) < 2:
        return None
    rows = []
    for d in future:
        try:
            row = df_indexed.loc[(code, d)]
            rows.append({
                'trade_date': d,
                'open_price': float(row['open_price']),
                'high_price': float(row['high_price']),
                'low_price': float(row['low_price']),
                'close_price': float(row['close_price']),
            })
        except:
            pass
    return pd.DataFrame(rows) if rows else None

def simulate_exit(prices, entry_price, stop=-0.25, early_fail=-0.12, early_days=5,
                  trail_start=0.30, trail_pct=0.30, max_hold=50):
    """exit 시뮬레이션. 다음날 시가 진입 가정."""
    if prices is None or len(prices) < 2:
        return None, None, 'NO_DATA'

    # 첫 행은 entry date (시가로 진입)
    entry_row = prices.iloc[0]
    actual_entry = float(entry_row['open_price']) if float(entry_row['open_price']) > 0 else entry_price

    peak = actual_entry

    for i, row in prices.iloc[1:].iterrows():
        day_idx = prices.index.get_loc(i)  # 0-based within this series
        lo = float(row['low_price'])
        hi = float(row['high_price'])
        cl = float(row['close_price'])

        ret_from_entry = (cl - actual_entry) / actual_entry
        ret_low = (lo - actual_entry) / actual_entry

        # early fail (처음 early_days 거래일)
        if day_idx <= early_days:
            if ret_low <= early_fail:
                exit_price = actual_entry * (1 + early_fail)
                return row['trade_date'], (exit_price - actual_entry) / actual_entry - COST, 'EARLY_FAIL'

        # stop loss
        if ret_low <= stop:
            exit_price = actual_entry * (1 + stop)
            return row['trade_date'], (exit_price - actual_entry) / actual_entry - COST, 'STOP'

        # trailing stop
        peak = max(peak, hi)
        peak_ret = (peak - actual_entry) / actual_entry
        if peak_ret >= trail_start:
            trail_from_peak = (cl - peak) / peak
            if trail_from_peak <= -trail_pct:
                return row['trade_date'], (cl - actual_entry) / actual_entry - COST, 'TRAIL'

        # max hold
        if day_idx >= max_hold - 1:
            return row['trade_date'], (cl - actual_entry) / actual_entry - COST, 'MAX'

    # 마지막 날
    last = prices.iloc[-1]
    cl = float(last['close_price'])
    return last['trade_date'], (cl - actual_entry) / actual_entry - COST, 'MAX'

def run_backtest(delay=5, top_n=10, exclude_codes=None,
                 stop=-0.25, early_fail=-0.12, trail_start=0.30, trail_pct=0.30, max_hold=50,
                 monthly_loss_stop=-0.15,
                 entry_drawdown_cap=-0.08, entry_loc_min=0.55, entry_shadow_max=0.12, entry_body_min=-0.03):

    if exclude_codes is None:
        exclude_codes = set()

    trades = []

    # 5거래일 케이던스로 시그널 날짜 선택
    signal_dates = sorted(candidates['trade_date'].unique())
    cadence_dates = []
    prev_pd = None
    all_dates_pd = [pd.Timestamp(d) for d in all_dates]
    all_dates_set = set(all_dates_pd)

    for d in signal_dates:
        dpd = pd.Timestamp(d)
        if prev_pd is None or (dpd - prev_pd).days >= 5:
            # 5거래일 이상 지났는지 확인 (달력 기준 5일 이상 + 거래일 기준)
            if prev_pd is None:
                cadence_dates.append(dpd)
                prev_pd = dpd
            else:
                # 이전 시그널 날짜로부터 5 거래일 이상 경과
                prev_idx = date_to_idx.get(prev_pd)
                curr_idx = date_to_idx.get(dpd)
                if prev_idx is not None and curr_idx is not None and curr_idx - prev_idx >= 5:
                    cadence_dates.append(dpd)
                    prev_pd = dpd

    monthly_pnl = {}  # year-month -> cumulative pnl for monthly loss stop
    open_trade_end = None  # non-overlap

    for sig_date in cadence_dates:
        # monthly loss stop 체크
        ym = (sig_date.year, sig_date.month)
        if monthly_pnl.get(ym, 0) <= monthly_loss_stop:
            continue

        # non-overlap: 이전 거래 청산 전이면 스킵
        if open_trade_end is not None and sig_date <= open_trade_end:
            continue

        # 해당 시그널 날짜 후보들 (점수 순)
        day_cands = candidates[candidates['trade_date'] == sig_date]
        if len(day_cands) == 0:
            continue

        day_cands = day_cands[~day_cands['asset_code'].isin(exclude_codes)]
        day_cands = day_cands.sort_values('score', ascending=False).head(top_n)

        selected = None
        for _, cand in day_cands.iterrows():
            code = cand['asset_code']

            # entry date = signal date + delay 거래일
            entry_date = get_nth_trading_day(code, sig_date, delay)
            if entry_date is None:
                continue

            # entry 확인 데이터
            try:
                entry_row = df_indexed.loc[(code, entry_date)]
            except:
                continue

            entry_close = float(entry_row['close_price'])
            sig_close = float(cand['close_price'])

            # entry confirmation
            close_drawdown = (entry_close - sig_close) / sig_close
            if close_drawdown < entry_drawdown_cap:
                continue

            entry_loc = float(entry_row['candle_loc'])
            entry_shadow = float(entry_row['upper_shadow'])

            hi = float(entry_row['high_price'])
            lo = float(entry_row['low_price'])
            op = float(entry_row['open_price'])
            cl = float(entry_row['close_price'])
            hl = hi - lo
            body_ret = (cl - op) / op if op > 0 else 0

            if entry_loc < entry_loc_min:
                continue
            if entry_shadow > entry_shadow_max:
                continue
            if body_ret < entry_body_min:
                continue

            selected = (cand, entry_date)
            break

        if selected is None:
            continue

        cand, entry_date = selected
        code = cand['asset_code']
        name = cand['asset_name']

        # 진입 시가 기준 (다음날 시가)
        next_day = get_nth_trading_day(code, entry_date, 1)
        if next_day is None:
            continue

        future = get_future_prices(code, next_day, max_hold + 1)
        if future is None or len(future) < 2:
            continue

        entry_price = float(df_indexed.loc[(code, next_day)]['open_price'])
        if entry_price <= 0:
            continue

        exit_date, ret, reason = simulate_exit(
            future, entry_price, stop, early_fail, 5,
            trail_start, trail_pct, max_hold
        )

        if exit_date is None:
            continue

        # monthly pnl update
        exit_ym = (pd.Timestamp(exit_date).year, pd.Timestamp(exit_date).month)
        monthly_pnl[exit_ym] = monthly_pnl.get(exit_ym, 0) + ret

        open_trade_end = pd.Timestamp(exit_date)

        trades.append({
            'period': 'pre' if pd.Timestamp(sig_date) <= pd.Timestamp(PRE_END)
                       else ('train' if pd.Timestamp(sig_date) <= pd.Timestamp(TRAIN_END) else 'post'),
            'signal_date': sig_date,
            'asset_code': code,
            'asset_name': name,
            'entry_date': entry_date,
            'exit_date': exit_date,
            'ret': ret,
            'reason': reason,
            'sig_range20': float(cand['range20']),
            'sig_ret60': float(cand['ret60']),
        })

    return pd.DataFrame(trades)

def summarize(trades_df, label=''):
    if trades_df is None or len(trades_df) == 0:
        return f"{label}: 거래 없음"

    results = []
    for period in ['pre', 'train', 'post']:
        sub = trades_df[trades_df['period'] == period]
        if len(sub) == 0:
            results.append(f"  {period}: 0 trades")
            continue

        # 월별 수익률 계산
        sub2 = sub.copy()
        sub2['exit_ym'] = pd.to_datetime(sub2['exit_date']).dt.to_period('M')
        monthly = sub2.groupby('exit_ym')['ret'].sum()

        avg_m = monthly.mean() * 100
        total = ((1 + sub['ret']).prod() - 1) * 100
        worst = monthly.min() * 100
        n = len(sub)
        win = (sub['ret'] > 0).mean() * 100

        results.append(f"  {period}: avg={avg_m:.2f}% total={total:.2f}% worst={worst:.2f}% N={n} win={win:.1f}%")

    return (f"{label}\n" + "\n".join(results))

print("[5/7] 메인 백테스트 실행 중 (delay=5, top10)...")
base_trades = run_backtest(delay=5, top_n=10)
print(summarize(base_trades, "BASE (delay=5, top10, 전체기간)"))

print("\n[5b] 제이엘케이(322510) 제외 재계산...")
no_jlk = run_backtest(delay=5, top_n=10, exclude_codes={'322510'})
print(summarize(no_jlk, "제이엘케이 제외 (delay=5, top10)"))

print("\n[6/7] Entry delay 민감도...")
for d in [1, 3, 5, 10]:
    t = run_backtest(delay=d, top_n=10)
    print(summarize(t, f"delay={d}d, top10"))

print("\n[6b] Top fallback 민감도...")
for n in [1, 3, 5, 10]:
    t = run_backtest(delay=5, top_n=n)
    print(summarize(t, f"delay=5d, top{n}"))

print("\n[7/7] CSV 저장...")
if len(base_trades) > 0:
    base_trades.to_csv(
        r'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-extended-trades.csv',
        index=False, encoding='utf-8-sig'
    )

# 결과 마크다운 저장
lines = ["# W4 Extended Sensitivity Backtest\n"]
lines.append(f"date: 2026-05-26\n")
lines.append(f"period: {PRE_START}~{POST_END}\n")
lines.append(f"pre: {PRE_START}~{PRE_END}\n")
lines.append(f"train: {TRAIN_START}~{TRAIN_END}\n")
lines.append(f"post: {POST_START}~{POST_END}\n\n")

def table_row(trades_df, period):
    sub = trades_df[trades_df['period'] == period]
    if len(sub) == 0:
        return f"| {period} | - | - | - | 0 | - |"
    sub2 = sub.copy()
    sub2['exit_ym'] = pd.to_datetime(sub2['exit_date']).dt.to_period('M')
    monthly = sub2.groupby('exit_ym')['ret'].sum()
    avg_m = monthly.mean() * 100
    total = ((1 + sub['ret']).prod() - 1) * 100
    worst = monthly.min() * 100
    n = len(sub)
    win = (sub['ret'] > 0).mean() * 100
    return f"| {period} | {avg_m:.2f}% | {total:.2f}% | {worst:.2f}% | {n} | {win:.1f}% |"

header = "| period | avg monthly | total | worst month | N | win rate |\n|---|---:|---:|---:|---:|---:|"

lines.append("## 1. Base (delay=5, top10) - 전체기간 확장\n\n")
lines.append(header + "\n")
for p in ['pre','train','post']:
    lines.append(table_row(base_trades, p) + "\n")

lines.append("\n## 2. 제이엘케이(322510) 제외\n\n")
lines.append(header + "\n")
for p in ['pre','train','post']:
    lines.append(table_row(no_jlk, p) + "\n")

lines.append("\n## 3. Entry delay 민감도\n\n")
lines.append("| delay | pre avg | pre N | train avg | train N | post avg | post N |\n|---|---:|---:|---:|---:|---:|---:|\n")
for d in [1, 3, 5, 10]:
    t = run_backtest(delay=d, top_n=10)
    def gm(df, p):
        sub = df[df['period']==p]
        if len(sub)==0: return '-', 0
        sub2 = sub.copy()
        sub2['ym'] = pd.to_datetime(sub2['exit_date']).dt.to_period('M')
        m = sub2.groupby('ym')['ret'].sum()
        return f"{m.mean()*100:.2f}%", len(sub)
    pm, pn = gm(t,'pre'); trm, trn = gm(t,'train'); pom, pon = gm(t,'post')
    lines.append(f"| {d}d | {pm} | {pn} | {trm} | {trn} | {pom} | {pon} |\n")

lines.append("\n## 4. Top fallback 민감도\n\n")
lines.append("| top_n | pre avg | pre N | train avg | train N | post avg | post N |\n|---|---:|---:|---:|---:|---:|---:|\n")
for n in [1, 3, 5, 10]:
    t = run_backtest(delay=5, top_n=n)
    pm, pn = gm(t,'pre'); trm, trn = gm(t,'train'); pom, pon = gm(t,'post')
    lines.append(f"| top{n} | {pm} | {pn} | {trm} | {trn} | {pom} | {pon} |\n")

lines.append("\n## 5. 주요 거래 (train)\n\n")
if len(base_trades) > 0:
    train_t = base_trades[base_trades['period']=='train'].sort_values('ret', ascending=False)
    lines.append("| 종목 | 시그널 | 진입 | 청산 | 수익률 | 사유 |\n|---|---|---|---|---:|---|\n")
    for _, r in train_t.head(10).iterrows():
        lines.append(f"| {r['asset_name']} | {str(r['signal_date'])[:10]} | {str(r['entry_date'])[:10]} | {str(r['exit_date'])[:10]} | {r['ret']*100:.1f}% | {r['reason']} |\n")

with open(r'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-extended-sensitivity.md', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\n완료. 결과 저장됨.")
print(f"  - trades: .Codex/reports/2026-05-26_w4-extended-trades.csv")
print(f"  - report: .Codex/reports/2026-05-26_w4-extended-sensitivity.md")
