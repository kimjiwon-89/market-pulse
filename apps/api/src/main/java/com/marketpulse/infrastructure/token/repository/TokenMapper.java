package com.marketpulse.infrastructure.token.repository;

import com.marketpulse.infrastructure.token.domain.ApiToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TokenMapper {
    ApiToken findLatest();

    void upsert(ApiToken token);
}
