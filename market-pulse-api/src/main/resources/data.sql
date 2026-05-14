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