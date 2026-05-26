import psycopg2, pandas as pd
DB = dict(host='localhost', port=5432, dbname='marketpulse', user='postgres', password='postgreskh')
conn = psycopg2.connect(**DB)

# quant_candle_feature_snapshot 컬럼 확인
try:
    r = pd.read_sql("SELECT * FROM quant_candle_feature_snapshot LIMIT 1", conn)
    print("snapshot 컬럼:", list(r.columns))
    print("sample:", r.iloc[0].to_dict())
except Exception as e:
    print("snapshot 오류:", e)

# 제이엘케이 snapshot에서
try:
    r2 = pd.read_sql("""
        SELECT * FROM quant_candle_feature_snapshot
        WHERE asset_code='322510'
        ORDER BY signal_date
        LIMIT 5
    """, conn)
    print("\n제이엘케이 snapshot:")
    print(r2.to_string())
except Exception as e:
    print("제이엘케이 snapshot 오류:", e)

# snapshot 범위
try:
    r3 = pd.read_sql("SELECT MIN(signal_date), MAX(signal_date), COUNT(DISTINCT asset_code), COUNT(*) FROM quant_candle_feature_snapshot", conn)
    print("\nsnapshot 범위:", r3.iloc[0].to_dict())
except Exception as e:
    print("snapshot 범위 오류:", e)

conn.close()
