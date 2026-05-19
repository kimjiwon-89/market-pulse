package com.marketpulse.infrastructure.token.repository;

import com.marketpulse.infrastructure.token.domain.ApiToken;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;


/**
 * Redis 캐시 전용 토큰 저장소
 * 단일 토큰만 사용
 */
@Repository
@RequiredArgsConstructor
public class RedisTokenRepository {

    private static final String KEY = "API_TOKEN";

    private final RedisTemplate<String, ApiToken> redisTemplate;

    public ApiToken find() {
        try {
            return redisTemplate.opsForValue().get(KEY);
        } catch (Exception e) {
            return null;
        }
    }

    public void save(ApiToken token) {
        try {
            redisTemplate.opsForValue().set(KEY, token);
        } catch (Exception e) {
            // Redis 미실행 시 무시 — DB 저장으로 대체
        }
    }

    public void delete() {
        try {
            redisTemplate.delete(KEY);
        } catch (Exception e) {
            // ignore
        }
    }
}