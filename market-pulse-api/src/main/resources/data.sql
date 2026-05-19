-- =============================================
-- 시퀀스
-- =============================================

CREATE SEQUENCE IF NOT EXISTS api_token_id_seq             AS integer;
CREATE SEQUENCE IF NOT EXISTS users_id_seq                 AS integer;
CREATE SEQUENCE IF NOT EXISTS investor_memo_id_seq         AS integer;
CREATE SEQUENCE IF NOT EXISTS index_snapshot_id_seq        AS bigint;
CREATE SEQUENCE IF NOT EXISTS news_snapshot_id_seq         AS bigint;
CREATE SEQUENCE IF NOT EXISTS ranking_snapshot_id_seq      AS bigint;
CREATE SEQUENCE IF NOT EXISTS market_flow_snapshot_id_seq  AS bigint;
CREATE SEQUENCE IF NOT EXISTS lotto_analysis_pool_id_seq   AS bigint;
CREATE SEQUENCE IF NOT EXISTS lotto_analysis_result_id_seq AS bigint;
CREATE SEQUENCE IF NOT EXISTS lotto_user_combo_id_seq      AS bigint;

-- =============================================
-- 인프라 (KIS API 토큰 캐싱)
-- =============================================

CREATE TABLE IF NOT EXISTS api_token (
    id           SERIAL    PRIMARY KEY,
    access_token TEXT      NOT NULL,
    expired_at   TIMESTAMP NOT NULL,
    created_at   TIMESTAMP          DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 사용자 (인증 / 관리자)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL       PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMP             DEFAULT NOW()
);

-- =============================================
-- 업종 지수 스냅샷
-- =============================================

CREATE TABLE IF NOT EXISTS index_snapshot (
    id            BIGSERIAL     PRIMARY KEY,
    snap_date     DATE          NOT NULL,
    index_code    VARCHAR(20)   NOT NULL,
    index_name    VARCHAR(100)  NOT NULL,
    current_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    change_rate   DECIMAL(8,2)  NOT NULL DEFAULT 0,
    trade_volume  BIGINT        NOT NULL DEFAULT 0,
    trade_amount  BIGINT        NOT NULL DEFAULT 0,
    daily_json    JSONB,
    updated_at    TIMESTAMP              DEFAULT NOW(),
    UNIQUE (snap_date, index_code)
);

-- =============================================
-- 뉴스 스냅샷
-- =============================================

CREATE TABLE IF NOT EXISTS news_snapshot (
    id        BIGSERIAL   PRIMARY KEY,
    news_no   VARCHAR(50) NOT NULL UNIQUE,
    news_date DATE        NOT NULL,
    news_time VARCHAR(10),
    title     TEXT        NOT NULL,
    raw_json  JSONB
);
CREATE INDEX IF NOT EXISTS idx_news_snapshot_date ON news_snapshot (news_date DESC, news_time DESC);

-- =============================================
-- 투자자 매매동향
-- =============================================

-- 메모 (날짜 + 시장 조합당 1개, upsert)
CREATE TABLE IF NOT EXISTS investor_memo (
    id         SERIAL      PRIMARY KEY,
    memo_date  DATE        NOT NULL,
    market     VARCHAR(10) NOT NULL,  -- KOSPI | KOSDAQ
    content    TEXT        NOT NULL,
    created_at TIMESTAMP            DEFAULT NOW(),
    updated_at TIMESTAMP            DEFAULT NOW(),
    CONSTRAINT uq_investor_memo_date_market UNIQUE (memo_date, market)
);

-- 순매수/순매도 랭킹 스냅샷 (매일 장 마감 저장)
CREATE TABLE IF NOT EXISTS ranking_snapshot (
    id             BIGSERIAL    PRIMARY KEY,
    snap_date      DATE         NOT NULL,
    investor_type  VARCHAR(20)  NOT NULL,  -- FOREIGN | INSTITUTION
    trade_type     VARCHAR(10)  NOT NULL,  -- BUY | SELL
    market         VARCHAR(10)  NOT NULL,  -- KOSPI | KOSDAQ | ALL
    rank           INTEGER      NOT NULL,
    stock_code     VARCHAR(10)  NOT NULL,
    stock_name     VARCHAR(100) NOT NULL,
    net_buy_amount BIGINT       NOT NULL DEFAULT 0,
    net_buy_volume BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT uq_ranking_snapshot UNIQUE (snap_date, investor_type, trade_type, market, rank)
);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshot_date ON ranking_snapshot (snap_date);

-- 시장 전체 투자자 흐름 스냅샷 (외국인/기관/개인 매수·매도·순매수)
CREATE TABLE IF NOT EXISTS market_flow_snapshot (
    id         BIGSERIAL   PRIMARY KEY,
    snap_date  DATE        NOT NULL,
    market     VARCHAR(10) NOT NULL,  -- KOSPI | KOSDAQ
    frgn_buy   BIGINT      NOT NULL DEFAULT 0,
    frgn_sell  BIGINT      NOT NULL DEFAULT 0,
    frgn_net   BIGINT      NOT NULL DEFAULT 0,
    orgn_buy   BIGINT      NOT NULL DEFAULT 0,
    orgn_sell  BIGINT      NOT NULL DEFAULT 0,
    orgn_net   BIGINT      NOT NULL DEFAULT 0,
    indv_buy   BIGINT      NOT NULL DEFAULT 0,
    indv_sell  BIGINT      NOT NULL DEFAULT 0,
    indv_net   BIGINT      NOT NULL DEFAULT 0,
    updated_at TIMESTAMP            DEFAULT NOW(),
    UNIQUE (snap_date, market)
);

-- =============================================
-- 종목 마스터 (KRX 전종목 / 매일 자정 자동 갱신)
-- =============================================

CREATE TABLE IF NOT EXISTS stock_master (
    code       VARCHAR(10)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    market     VARCHAR(10)  NOT NULL,  -- KOSPI | KOSDAQ | KONEX
    sector     VARCHAR(100),
    updated_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_master_name ON stock_master (name);

-- 시드 데이터 (KRX 스케줄러 첫 실행 전 검색 기능용)
INSERT INTO stock_master (code, name, market, sector) VALUES
-- KOSPI 대형주
('005930', '삼성전자',        'KOSPI', '전기전자'),
('000660', 'SK하이닉스',      'KOSPI', '전기전자'),
('373220', 'LG에너지솔루션',  'KOSPI', '전기전자'),
('207940', '삼성바이오로직스', 'KOSPI', '의약품'),
('005380', '현대차',          'KOSPI', '운수장비'),
('000270', '기아',            'KOSPI', '운수장비'),
('068270', '셀트리온',        'KOSPI', '의약품'),
('005490', 'POSCO홀딩스',     'KOSPI', '철강금속'),
('035420', 'NAVER',           'KOSPI', '서비스업'),
('051910', 'LG화학',          'KOSPI', '화학'),
('006400', '삼성SDI',         'KOSPI', '전기전자'),
('035720', '카카오',          'KOSPI', '서비스업'),
('003550', 'LG',              'KOSPI', '전기전자'),
('028260', '삼성물산',        'KOSPI', '유통업'),
('012330', '현대모비스',      'KOSPI', '운수장비'),
('066570', 'LG전자',          'KOSPI', '전기전자'),
('096770', 'SK이노베이션',    'KOSPI', '화학'),
('017670', 'SK텔레콤',        'KOSPI', '통신업'),
('030200', 'KT',              'KOSPI', '통신업'),
('032830', '삼성생명',        'KOSPI', '보험'),
('055550', '신한지주',        'KOSPI', '금융업'),
('086790', '하나금융지주',    'KOSPI', '금융업'),
('105560', 'KB금융',          'KOSPI', '금융업'),
('316140', '우리금융지주',    'KOSPI', '금융업'),
('003490', '대한항공',        'KOSPI', '운수창고'),
('009150', '삼성전기',        'KOSPI', '전기전자'),
('011170', '롯데케미칼',      'KOSPI', '화학'),
('010950', 'S-Oil',           'KOSPI', '화학'),
('018260', '삼성에스디에스',  'KOSPI', '서비스업'),
('011200', 'HMM',             'KOSPI', '운수창고'),
('047810', '한국항공우주',    'KOSPI', '운수장비'),
('015760', '한국전력',        'KOSPI', '전기가스업'),
('034730', 'SK',              'KOSPI', '서비스업'),
('003670', '포스코퓨처엠',    'KOSPI', '화학'),
('138040', '메리츠금융지주',  'KOSPI', '금융업'),
('024110', '기업은행',        'KOSPI', '금융업'),
('000810', '삼성화재',        'KOSPI', '보험'),
('088350', '한화생명',        'KOSPI', '보험'),
('029780', '삼성카드',        'KOSPI', '금융업'),
('032640', 'LG유플러스',      'KOSPI', '통신업'),
('036570', 'NC소프트',        'KOSPI', '서비스업'),
('251270', '넷마블',          'KOSPI', '서비스업'),
('259960', '크래프톤',        'KOSPI', '서비스업'),
('064350', '현대로템',        'KOSPI', '운수장비'),
('010140', '삼성중공업',      'KOSPI', '기계'),
('042660', '한화오션',        'KOSPI', '기계'),
('009540', 'HD한국조선해양',  'KOSPI', '기계'),
('267250', 'HD현대',          'KOSPI', '기계'),
('000100', '유한양행',        'KOSPI', '의약품'),
('128940', '한미약품',        'KOSPI', '의약품'),
('185750', '종근당',          'KOSPI', '의약품'),
('326030', 'SK바이오팜',      'KOSPI', '의약품'),
('302440', 'SK바이오사이언스', 'KOSPI', '의약품'),
('039490', 'SK증권',          'KOSPI', '금융업'),
-- KOSDAQ 대형주
('247540', '에코프로비엠',        'KOSDAQ', '전기전자'),
('086520', '에코프로',            'KOSDAQ', '화학'),
('091990', '셀트리온헬스케어',    'KOSDAQ', '의약품'),
('196170', '알테오젠',            'KOSDAQ', '의약품'),
('112040', '위메이드',            'KOSDAQ', '서비스업'),
('357780', '솔브레인',            'KOSDAQ', '화학'),
('041510', '에스엠',              'KOSDAQ', '서비스업'),
('035900', 'JYP Ent',             'KOSDAQ', '서비스업'),
('122870', '와이지엔터테인먼트',  'KOSDAQ', '서비스업'),
('293490', '카카오게임즈',        'KOSDAQ', '서비스업'),
('263750', '펄어비스',            'KOSDAQ', '서비스업'),
('045360', '웹젠',                'KOSDAQ', '서비스업'),
('145020', '휴젤',                'KOSDAQ', '의약품'),
('214150', '클래시스',            'KOSDAQ', '의약품'),
('236340', '메가스터디교육',      'KOSDAQ', '서비스업'),
('035760', 'CJ ENM',              'KOSDAQ', '서비스업')
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    market     = EXCLUDED.market,
    sector     = EXCLUDED.sector,
    updated_at = NOW();

-- =============================================
-- 로또 분석 연구소
-- =============================================

-- 회차별 당첨 번호 (draw_no는 자연키, 시퀀스 없음)
CREATE TABLE IF NOT EXISTS lotto_result (
    draw_no    INTEGER   PRIMARY KEY,
    draw_date  DATE      NOT NULL,
    no1        INTEGER   NOT NULL,
    no2        INTEGER   NOT NULL,
    no3        INTEGER   NOT NULL,
    no4        INTEGER   NOT NULL,
    no5        INTEGER   NOT NULL,
    no6        INTEGER   NOT NULL,
    bonus_no   INTEGER   NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 전략별 풀(10개) + 추천 조합(3개)
CREATE TABLE IF NOT EXISTS lotto_analysis_pool (
    id           BIGSERIAL   PRIMARY KEY,
    draw_no      INTEGER     NOT NULL,
    strategy     VARCHAR(20) NOT NULL,  -- MOMENTUM|SUBMARINE|NETWORK|PATTERN|AI_PICK
    pool_numbers INTEGER[]   NOT NULL,  -- 10개
    combos       JSONB,                 -- [[n1,n2,n3,n4,n5,n6], ...]
    created_at   TIMESTAMP   DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 전략별 적중률 (당첨 번호 확정 후 채워짐)
CREATE TABLE IF NOT EXISTS lotto_analysis_result (
    id             BIGSERIAL   PRIMARY KEY,
    draw_no        INTEGER     NOT NULL,
    strategy       VARCHAR(20) NOT NULL,  -- MOMENTUM|SUBMARINE|NETWORK|PATTERN|AI_PICK
    pool_hit_count INTEGER     NOT NULL,  -- 풀 10개 중 당첨번호 포함 수
    combo_results  JSONB,                 -- [{combo:[...], hitCount:N}, ...]
    created_at     TIMESTAMP   DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 토론장 댓글
CREATE TABLE IF NOT EXISTS lotto_comment (
    id         BIGSERIAL    PRIMARY KEY,
    draw_no    INTEGER      NOT NULL,
    username   VARCHAR(50)  NOT NULL,
    content    TEXT         NOT NULL,
    image_url  VARCHAR(500),
    is_deleted BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lotto_comment_draw_no ON lotto_comment(draw_no);

-- 사용자 저장 조합
CREATE TABLE IF NOT EXISTS lotto_user_combo (
    id         BIGSERIAL PRIMARY KEY,
    draw_no    INTEGER   NOT NULL,
    username   VARCHAR(50),
    numbers    INTEGER[] NOT NULL,  -- 6개
    hit_count  INTEGER,             -- 당첨 결과 확인 후 채워짐
    created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE lotto_user_combo ADD COLUMN IF NOT EXISTS username VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_lotto_user_combo_username ON lotto_user_combo (username, draw_no);

/*
    REDIS 설치
    brew install redis

    서비스 실행
    brew services start redis

    실행 확인
    redis-cli ping  -> PONG

    redis-cli
        keys *          -- 키 전체 조회
        get KEY         -- 특정 키 조회 (예: get API_TOKEN)
*/
