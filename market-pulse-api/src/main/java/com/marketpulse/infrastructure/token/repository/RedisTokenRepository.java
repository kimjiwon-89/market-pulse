package com.marketpulse.infrastructure.token.repository;

import com.marketpulse.infrastructure.token.domain.ApiToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDateTime;


/**
 * Redis 캐시 전용 토큰 저장소
 * 단일 토큰만 사용
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisTokenRepository {

    private static final String KEY = "API_TOKEN";

    private final RedisTemplate<String, ApiToken> redisTemplate;

    public ApiToken find() {
        try {
            return redisTemplate.opsForValue().get(KEY);
        } catch (Exception e) {
            log.warn("Redis token lookup failed: {}", e.getMessage());
            return null;
        }
    }

    public void save(ApiToken token) {
        try {
            if (token.getExpiredAt() == null) {
                redisTemplate.opsForValue().set(KEY, token);
                return;
            }

            Duration ttl = Duration.between(LocalDateTime.now(), token.getExpiredAt().minusMinutes(5));
            if (ttl.isNegative() || ttl.isZero()) {
                redisTemplate.delete(KEY);
                return;
            }

            redisTemplate.opsForValue().set(KEY, token, ttl);
        } catch (Exception e) {
            log.warn("Redis token save failed: {}", e.getMessage());
        }
    }

    public void delete() {
        try {
            redisTemplate.delete(KEY);
        } catch (Exception e) {
            log.warn("Redis token delete failed: {}", e.getMessage());
        }
    }
}
