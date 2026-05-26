import psycopg2, pandas as pd
DB = dict(host='localhost', port=5432, dbname='marketpulse', user='postgres', password='postgreskh')
conn = psycopg2.connect(**DB)

# 제이엘케이 상장일
r = pd.read_sql("SELECT MIN(trade_date), MAX(trade_date), COUNT(*) FROM market_daily_price WHERE asset_code='322510' AND asset_type='STOCK'", conn)
print("제이엘케이 데이터:", r.iloc[0].to_dict())

# quant_candle_feature_snapshot 확인
try:
    r2 = pd.read_sql("SELECT * FROM quant_candle_feature_snapshot WHERE asset_code='322510' ORDER BY signal_date LIMIT 3", conn)
    print("candle_feature_snapshot:", r2[['signal_date','range20','ret60','ma60_dist']].to_string())
except Exception as e:
    print("candle_feature_snapshot 오류:", e)

# base trades 분석
trades = pd.read_csv(r'D:\market-pulse\quant-model-lab\.Codex\reports\2026-05-26_w4-extended-trades.csv')
print(f"\n전체 거래수: {len(trades)}")
print("reason 분포:")
print(trades['reason'].value_counts())
print("\ntrain 거래:")
tr = trades[trades['period']=='train'].sort_values('ret', ascending=False)
for _, r in tr.iterrows():
    print(f"  {r['asset_name']} ret={r['ret']*100:.1f}% reason={r['reason']} entry={r['entry_date'][:10]}")

conn.close()
