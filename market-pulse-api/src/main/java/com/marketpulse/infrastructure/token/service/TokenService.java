package com.marketpulse.infrastructure.token.service;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.infrastructure.token.client.TokenApiClient;
import com.marketpulse.infrastructure.token.domain.ApiToken;
import com.marketpulse.infrastructure.token.repository.DbTokenRepository;
import com.marketpulse.infrastructure.token.repository.RedisTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


/**
 * 토큰 발급 및 유효성 관리 핵심 서비스
 *
 * 전략:
 * 1. Redis에서 토큰 조회
 * 2. 없거나 만료면 재발급
 * 3. 항상 유효한 토큰 반환
 */

@Service
@RequiredArgsConstructor
public class TokenService {

    private final RedisTokenRepository redisRepository;
    private final DbTokenRepository dbRepository;
    private final TokenApiClient tokenApiClient; // 바로 주입

    public synchronized String getValidToken() {

        // 1. Redis 조회
        ApiToken token = redisRepository.find();
        if (token != null && !token.isExpired()) {
            return token.getAccessToken();
        }

        // 2. DB 조회
        token = dbRepository.find();
        if (token != null && !token.isExpired()) {
            redisRepository.save(token);
            return token.getAccessToken();
        }

        // 3. 신규 발급
        ApiToken newToken = tokenApiClient.issueToken();

        dbRepository.save(newToken);
        redisRepository.save(newToken);

        return newToken.getAccessToken();
    }

}