"""최종 조합 테스트 - 빠른 trail + max hold 30 + 추가 필터"""
import psycopg2, pandas as pd, numpy as np, warnings
warnings.filterwarnings('ignore')

DB = dict(host='localhost', port=5432, dbname='marketpulse', user='postgres', password='postgreskh')
PRE_START='2015-01-01'; PRE_END='2022-04-30'
TRAIN_START='2022-05-01'; TRAIN_END='2025-07-31'
POST_START='2025-08-01'; POST_END='2026-05-20'
COST=0.003

conn = psycopg2.connect(**DB)
df_raw = pd.read_sql("""
    SELECT asset_code, asset_name, asset_type, trade_date,
           open_price, high_price, low_price, close_price, volume
    FROM market_daily_price
    WHERE trade_date >= %s AND trade_date <= %s AND close_price > 0 AND volume > 0
    ORDER BY asset_code, trade_date
""", conn, params=[PRE_START, POST_END], parse_dates=['trade_date'])
conn.close()

df = df_raw.sort_values(['asset_code','trade_date']).reset_index(drop=True)
g = df.groupby('asset_code', group_keys=False)
df['ma20']  = g['close_price'].transform(lambda x: x.rolling(20,min_periods=20).mean())
df['ma60']  = g['close_price'].transform(lambda x: x.rolling(60,min_periods=60).mean())
df['avg_vol20'] = g['volume'].transform(lambda x: x.rolling(20,min_periods=20).mean())
df['ma20_slope5'] = g['ma20'].transform(lambda x: (x-x.shift(5))/x.shift(5))
df['ma60_slope5'] = g['ma60'].transform(lambda x: (x-x.shift(5))/x.shift(5))
df['ret60']  = g['close_price'].transform(lambda x: (x-x.shift(60))/x.shift(60))
df['ret20']  = g['close_price'].transform(lambda x: (x-x.shift(20))/x.shift(20))
df['max_high20'] = g['high_price'].transform(lambda x: x.rolling(20,min_periods=20).max())
df['min_low20']  = g['low_price'].transform(lambda x: x.rolling(20,min_periods=20).min())
df['range20'] = (df['max_high20']-df['min_low20'])/df['close_price']
df['ma60_dist'] = (df['close_price']-df['ma60'])/df['ma60']
hl = (df['high_price']-df['low_price']).clip(lower=1e-6)
df['candle_loc'] = (df['close_price']-df['low_price'])/hl
df['upper_shadow'] = (df['high_price']-df[['open_price','close_price']].max(axis=1))/hl
df['body_ret'] = (df['close_price']-df['open_price'])/df['open_price'].clip(lower=1e-6)
df['vol_exp'] = df['volume']/df['avg_vol20'].clip(lower=1e-6)
df['trade_amount'] = df['close_price']*df['volume']

kospi = df[df['asset_type']=='INDEX'].copy().sort_values('trade_date')
if len(kospi) > 0:
    kospi['kma60'] = kospi['close_price'].rolling(60,min_periods=60).mean()
    kospi['kma20'] = kospi['close_price'].rolling(20,min_periods=20).mean()
    regime_map60 = dict(zip(kospi['trade_date'], kospi['close_price'] > kospi['kma60']))
    regime_map20 = dict(zip(kospi['trade_date'], kospi['close_price'] > kospi['kma20']))
else:
    regime_map60 = {}; regime_map20 = {}

stocks = df[df['asset_type']=='STOCK'].dropna(subset=['ma20','ma60','ret60','range20','vol_exp'])
cond_w4 = (
    (stocks['range20']>=0.25)&(stocks['range20']<=0.55)&
    (stocks['ret60']>=0.20)&(stocks['ma60_dist']>0.05)&
    (stocks['close_price']>stocks['ma20'])&(stocks['close_price']>stocks['ma60'])&
    (stocks['vol_exp']<=3.0)&(stocks['ma20_slope5']>0)&(stocks['ma60_slope5']>0)&
    (stocks['candle_loc']>=0.45)&(stocks['upper_shadow']<=0.08)&
    (stocks['trade_amount']>=500_000_000)
)
candidates = stocks[cond_w4].copy()
candidates['score'] = candidates['range20']+candidates['ret60']+candidates['ma60_dist']

df_indexed = stocks.set_index(['asset_code','trade_date'])
all_dates = sorted(stocks['trade_date'].unique())
date_to_idx = {d:i for i,d in enumerate(all_dates)}
asset_dates = stocks.groupby('asset_code')['trade_date'].apply(sorted).to_dict()

def get_nth_day(code, sig, n):
    future = [d for d in asset_dates.get(code,[]) if d > pd.Timestamp(sig)]
    return future[n-1] if len(future)>=n else None

def get_future_prices(code, start, n):
    future = [d for d in asset_dates.get(code,[]) if d >= pd.Timestamp(start)][:n+1]
    rows = []
    for d in future:
        try:
            r = df_indexed.loc[(code,d)]
            rows.append({'trade_date':d,'open':float(r['open_price']),'high':float(r['high_price']),
                         'low':float(r['low_price']),'close':float(r['close_price'])})
        except: pass
    return pd.DataFrame(rows) if rows else None

def simulate_exit(prices, stop=-0.25, ef=-0.08, efd=3, ts=0.20, tp=0.20, mh=30):
    if prices is None or len(prices)<2: return None,None,'NO_DATA'
    ea = float(prices.iloc[0]['open']); peak=ea
    for i,(_,row) in enumerate(prices.iloc[1:].iterrows()):
        lo,hi,cl = float(row['low']),float(row['high']),float(row['close'])
        rl=(lo-ea)/ea
        if i<efd and rl<=ef: return row['trade_date'],ef-COST,'EARLY_FAIL'
        if rl<=stop: return row['trade_date'],stop-COST,'STOP'
        peak=max(peak,hi)
        if (peak-ea)/ea>=ts and (cl-peak)/peak<=-tp:
            return row['trade_date'],(cl-ea)/ea-COST,'TRAIL'
        if i>=mh-1: return row['trade_date'],(cl-ea)/ea-COST,'MAX'
    last=prices.iloc[-1]; return last['trade_date'],(float(last['close'])-ea)/ea-COST,'MAX'

def run_bt(delay=5, top_n=10,
           entry_drawdown=-0.05, entry_loc=0.65, entry_shadow=0.05, entry_body=0.00,
           stop=-0.25, ef=-0.08, efd=3, ts=0.20, tp=0.20, mh=30,
           ml_stop=-0.15, regime='ma60'):
    trades=[]; cad=[]; prev=None
    for d in sorted(candidates['trade_date'].unique()):
        ci=date_to_idx.get(d)
        if ci is None: continue
        if prev is None or ci-prev>=5: cad.append(d); prev=ci
    mpnl={}; ote=None
    rmap = regime_map60 if regime=='ma60' else regime_map20

    for sd in cad:
        sp=pd.Timestamp(sd); ym=(sp.year,sp.month)
        if mpnl.get(ym,0)<=ml_stop: continue
        if ote is not None and sp<=ote: continue
        if rmap and not rmap.get(sp,True): continue
        dc=candidates[candidates['trade_date']==sp]
        if len(dc)==0: continue
        dc=dc.sort_values('score',ascending=False).head(top_n)
        sel=None
        for _,c in dc.iterrows():
            code=c['asset_code']; ed=get_nth_day(code,sp,delay)
            if ed is None: continue
            try: er=df_indexed.loc[(code,ed)]
            except: continue
            if (float(er['close_price'])-float(c['close_price']))/float(c['close_price'])<entry_drawdown: continue
            if float(er['candle_loc'])<entry_loc: continue
            if float(er['upper_shadow'])>entry_shadow: continue
            if float(er['body_ret'])<entry_body: continue
            sel=(c,ed); break
        if sel is None: continue
        c,ed=sel; code=c['asset_code']
        nd=get_nth_day(code,ed,1)
        if nd is None: continue
        fut=get_future_prices(code,nd,mh+1)
        if fut is None or len(fut)<2: continue
        try: ep=float(df_indexed.loc[(code,nd)]['open_price'])
        except: continue
        if ep<=0: continue
        exd,ret,rsn=simulate_exit(fut,stop,ef,efd,ts,tp,mh)
        if exd is None: continue
        exym=(pd.Timestamp(exd).year,pd.Timestamp(exd).month)
        mpnl[exym]=mpnl.get(exym,0)+ret; ote=pd.Timestamp(exd)
        p=('pre' if sp<=pd.Timestamp(PRE_END) else ('train' if sp<=pd.Timestamp(TRAIN_END) else 'post'))
        trades.append({'period':p,'signal_date':sd,'asset_code':code,'asset_name':c['asset_name'],
                       'entry_date':ed,'exit_date':exd,'ret':ret,'reason':rsn})
    return pd.DataFrame(trades)

def summary(t, label, print_trades=False):
    print(f"\n{'='*50}")
    print(f"{label}")
    if t is None or len(t)==0: print("  거래없음"); return
    for p in ['pre','train','post']:
        s=t[t['period']==p]
        if len(s)==0: print(f"  {p}: 0"); continue
        s2=s.copy(); s2['ym']=pd.to_datetime(s2['exit_date']).dt.to_period('M')
        m=s2.groupby('ym')['ret'].sum()
        print(f"  {p}: avg={m.mean()*100:.2f}% total={((1+s['ret']).prod()-1)*100:.2f}% worst={m.min()*100:.2f}% N={len(s)} win={(s['ret']>0).mean()*100:.1f}%")
    if print_trades:
        tr=t[t['period']=='train'].sort_values('ret',ascending=False)
        for _,r in tr.iterrows():
            print(f"    {r['asset_name']} {r['ret']*100:.1f}% {r['reason']}")

# 최종 조합 테스트
print("최종 조합 테스트")

# V3b+d: trail 빠르게 + max hold 30
t = run_bt(ts=0.20, tp=0.20, mh=30, regime='ma60')
summary(t, "V3-FIN: trail(20/20) + hold30 + KOSPI>MA60", print_trades=True)

# ma20 regime (더 엄격)
t2 = run_bt(ts=0.20, tp=0.20, mh=30, regime='ma20')
summary(t2, "V3-MA20: trail(20/20) + hold30 + KOSPI>MA20 (더 엄격)", print_trades=True)

# entry delay 3일
t3 = run_bt(delay=3, ts=0.20, tp=0.20, mh=30, regime='ma60')
summary(t3, "V3-DEL3: delay=3 + trail(20/20) + hold30")

# entry delay 1일
t4 = run_bt(delay=1, ts=0.20, tp=0.20, mh=30, regime='ma60')
summary(t4, "V3-DEL1: delay=1 + trail(20/20) + hold30")

# 결과 저장
lines = ["# W4 Final Sensitivity Report\n\n"]
lines.append(f"date: 2026-05-26\npre: {PRE_START}~{PRE_END}\ntrain: {TRAIN_START}~{TRAIN_END}\npost: {POST_START}~{POST_END}\n\n")

def build_table(variants):
    hdr = "| variant | period | avg monthly | total | worst | N | win |\n|---|---|---:|---:|---:|---:|---:|\n"
    rows = ""
    for lbl, df_ in variants:
        for p in ['pre','train','post']:
            if df_ is None or len(df_)==0:
                rows += f"| {lbl} | {p} | - | - | - | 0 | - |\n"; continue
            s=df_[df_['period']==p]
            if len(s)==0: rows += f"| {lbl} | {p} | - | - | - | 0 | - |\n"; continue
            s2=s.copy(); s2['ym']=pd.to_datetime(s2['exit_date']).dt.to_period('M')
            m=s2.groupby('ym')['ret'].sum()
            rows += (f"| {lbl} | {p} | {m.mean()*100:.2f}% | {((1+s['ret']).prod()-1)*100:.2f}% | "
                     f"{m.min()*100:.2f}% | {len(s)} | {(s['ret']>0).mean()*100:.1f}% |\n")
    return hdr + rows

lines.append(build_table([
    ("V3-FIN(trail20+hold30)", t),
    ("V3-MA20(stricter)", t2),
    ("V3-DEL3", t3),
    ("V3-DEL1", t4),
]))

with open(r'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-final-sensitivity.md','w',encoding='utf-8') as f:
    f.writelines(lines)

print("\n\n완료. 저장됨.")
