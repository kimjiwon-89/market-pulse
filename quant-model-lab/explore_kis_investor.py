"""KIS API tr_id 탐색 - 시장 전체 투자자 순매수 엔드포인트 찾기"""
import requests, json, re

BASE = 'https://openapi.koreainvestment.com:9443'

with open('../market-pulse-api/src/main/resources/application.yml', encoding='utf-8') as f:
    yml = f.read()
APP_KEY    = re.search(r'app-key:\s*(\S+)', yml).group(1)
APP_SECRET = re.search(r'app-secret:\s*(\S+)', yml).group(1)

import os, time as _time

_CACHE = '_kis_token_cache.json'

def _get_token():
    if os.path.exists(_CACHE):
        cached = json.loads(open(_CACHE).read())
        if cached.get('exp', 0) > _time.time() + 60:
            return cached['token']
    for attempt in range(3):
        _r = requests.post(BASE + '/oauth2/tokenP',
            json={'grant_type':'client_credentials','appkey':APP_KEY,'appsecret':APP_SECRET},
            timeout=10)
        _b = json.loads(_r.content.decode('utf-8'))
        if 'access_token' in _b:
            with open(_CACHE, 'w') as f:
                json.dump({'token': _b['access_token'], 'exp': _time.time() + 86000}, f)
            return _b['access_token']
        print(f'token retry {attempt+1}: {_b}')
        _time.sleep(65)
    raise RuntimeError('token fail after retries')

TOKEN = _get_token()
print(f'token ok (len={len(TOKEN)})\n')


def try_get(path, tr_id, params, label=''):
    h = {
        'Authorization': f'Bearer {TOKEN}',
        'appkey': APP_KEY,
        'appsecret': APP_SECRET,
        'tr_id': tr_id,
        'Content-Type': 'application/json',
    }
    try:
        r = requests.get(BASE + path, headers=h, params=params, timeout=8)
        body = r.json() if r.headers.get('content-type','').startswith('application/json') else {}
        rt_cd = body.get('rt_cd','?')
        msg   = body.get('msg1','')
        keys  = list(body.keys())
        # 성공이면 output 샘플 출력
        if rt_cd == '0':
            out = body.get('output', body.get('output1', body.get('output2',[])))
            sample = str(out)[:120] if out else '(empty)'
            print(f'  OK  {label or tr_id}: {sample}')
        else:
            print(f'  NG  {label or tr_id}: rt_cd={rt_cd} | {msg[:60]}')
        return body
    except Exception as e:
        print(f'  ERR {label or tr_id}: {e}')
        return {}


print('=== 1. FHKUP03500100 업종별 투자자 (날짜 포함) ===')
# 날짜 추가
try_get('/uapi/domestic-stock/v1/quotations/inquire-investor',
        'FHKUP03500100',
        {'fid_cond_mrkt_div_code':'U','fid_input_iscd':'0001',
         'fid_input_date_1':'20260523'}, 'U-0001+date')
try_get('/uapi/domestic-stock/v1/quotations/inquire-investor',
        'FHKUP03500100',
        {'fid_cond_mrkt_div_code':'U','fid_input_iscd':'0001',
         'fid_input_date_1':'20260523','fid_input_date_2':'20260523'}, 'U-0001+date2')

print('\n=== 2. 주식 투자자 동향 (종목코드 = 시장 대표) ===')
# 삼성전자 기준으로 tr_id FHKST01010900 정상 확인
try_get('/uapi/domestic-stock/v1/quotations/investor',
        'FHKST01010900',
        {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930'}, '삼전투자자')

print('\n=== 3. 시장 전체 투자자 매매동향 후보 ===')
# 외국인/기관 시장 전체 집계 tr_id 탐색
candidates = [
    ('/uapi/domestic-stock/v1/quotations/inquire-daily-trade',  'FHKST01020000',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930','fid_input_date_1':'20260523','fid_input_date_2':'20260523','fid_period_div_code':'D','fid_org_adj_prc':'1'}),
    # 투자자별 일별 매매종합
    ('/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market', 'FHKST03030100',
     {'fid_cond_mrkt_div_code':'J','fid_input_date_1':'20260523'}),
    ('/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market', 'FHKST03030200',
     {'fid_cond_mrkt_div_code':'J','fid_input_date_1':'20260523'}),
    # 외국인 투자자 종합
    ('/uapi/domestic-stock/v1/quotations/foreign-institution-total', 'FHKST01010900',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'0001','fid_input_date_1':'20260523'}),
]
for path, tr, params in candidates:
    try_get(path, tr, params, f'{tr}@{path.split("/")[-1]}')

print('\n=== 4. 시간별 투자자 동향 ===')
candidates2 = [
    ('/uapi/domestic-stock/v1/quotations/inquire-time-itemconclusion', 'FHKST01010300',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930','fid_input_hour_cls_code':'0'}),
    ('/uapi/domestic-stock/v1/quotations/inquire-ccnl', 'FHKST01010100',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930'}),
]
for path, tr, params in candidates2:
    try_get(path, tr, params)

print('\n=== 5. 공매도 / 프로그램 매매 ===')
candidates3 = [
    ('/uapi/domestic-stock/v1/quotations/inquire-program-trade-by-stock', 'FHPPG04650100',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930',
      'fid_input_date_1':'20260523','fid_input_date_2':'20260523'}),
    ('/uapi/domestic-stock/v1/quotations/inquire-program-trade-by-stock', 'FHPPG04650200',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930',
      'fid_input_date_1':'20260523','fid_input_date_2':'20260523'}),
    # 공매도
    ('/uapi/domestic-stock/v1/quotations/inquire-daily-trade', 'FHKST01020000',
     {'fid_cond_mrkt_div_code':'J','fid_input_iscd':'005930',
      'fid_input_date_1':'20260523','fid_input_date_2':'20260523',
      'fid_period_div_code':'D','fid_org_adj_prc':'1'}),
]
for path, tr, params in candidates3:
    try_get(path, tr, params)

print('\ndone')
