package com.marketpulse.infrastructure.token.repository;

import com.marketpulse.infrastructure.token.domain.ApiToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * DB 영구 저장소
 * 단일 토큰만 관리
 */
@Repository
@RequiredArgsConstructor
public class DbTokenRepository {

    private final TokenMapper mapper;

    public ApiToken find() {
        return mapper.findLatest();
    }

    public void save(ApiToken token) {
        mapper.upsert(token);
    }
}