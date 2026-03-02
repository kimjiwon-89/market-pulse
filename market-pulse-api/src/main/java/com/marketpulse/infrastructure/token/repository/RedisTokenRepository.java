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
        return redisTemplate.opsForValue().get(KEY);
    }

    public void save(ApiToken token) {
        redisTemplate.opsForValue().set(KEY, token);
    }

    public void delete() {
        redisTemplate.delete(KEY);
    }
}