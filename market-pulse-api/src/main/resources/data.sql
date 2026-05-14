CREATE TABLE api_token (
   id SERIAL PRIMARY KEY,
   access_token TEXT NOT NULL,
   expired_at TIMESTAMP NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investor_memo (
    id         SERIAL PRIMARY KEY,
    memo_date  DATE        NOT NULL,
    market     VARCHAR(10) NOT NULL,
    content    TEXT        NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_investor_memo_date_market UNIQUE (memo_date, market)
);


CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =============================================
-- 로또 분석 연구소
-- =============================================

CREATE TABLE lotto_result (
    draw_no    INTEGER PRIMARY KEY,
    draw_date  DATE    NOT NULL,
    no1        INTEGER NOT NULL,
    no2        INTEGER NOT NULL,
    no3        INTEGER NOT NULL,
    no4        INTEGER NOT NULL,
    no5        INTEGER NOT NULL,
    no6        INTEGER NOT NULL,
    bonus_no   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 회차별 전략 풀(10개) + 추천 조합(3개)
CREATE TABLE lotto_analysis_pool (
    id           BIGSERIAL    PRIMARY KEY,
    draw_no      INTEGER      NOT NULL,
    strategy     VARCHAR(20)  NOT NULL,  -- MOMENTUM|SUBMARINE|NETWORK|PATTERN|AI_PICK
    pool_numbers INTEGER[]    NOT NULL,  -- 10개
    combos       JSONB,                  -- [[n1,n2,n3,n4,n5,n6], ...]
    created_at   TIMESTAMP    DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 당첨 결과 대비 적중 분석
CREATE TABLE lotto_analysis_result (
    id             BIGSERIAL   PRIMARY KEY,
    draw_no        INTEGER     NOT NULL,
    strategy       VARCHAR(20) NOT NULL,
    pool_hit_count INTEGER     NOT NULL,  -- 풀 10개 중 당첨번호 포함 수
    combo_results  JSONB,                 -- [{combo:[...], hitCount:N}, ...]
    created_at     TIMESTAMP   DEFAULT NOW(),
    UNIQUE (draw_no, strategy)
);

-- 사용자 저장 조합
CREATE TABLE lotto_user_combo (
    id         BIGSERIAL PRIMARY KEY,
    draw_no    INTEGER   NOT NULL,
    numbers    INTEGER[] NOT NULL,  -- 6개
    hit_count  INTEGER,             -- 결과 확인 후 채워짐
    created_at TIMESTAMP DEFAULT NOW()
);

/*
    REDIS 설치
    brew install redis

    서비스 실행
    brew services start redis

    실행확인
    redis-cli ping
        -> PONG

    레디스 접속
    redis-cli

        키 전체 조회
        keys *

        특정 키 조회
        get KEY
            ex) get API_TOKEN
*/