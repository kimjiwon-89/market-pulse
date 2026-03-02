CREATE TABLE api_token (
   id SERIAL PRIMARY KEY,
   access_token TEXT NOT NULL,
   expired_at TIMESTAMP NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/*
    REDIS 설치
    brew install redis

    서비스 실행
    brew services start redis

    실행확인
    redis-cli ping
        -> PONG
*/