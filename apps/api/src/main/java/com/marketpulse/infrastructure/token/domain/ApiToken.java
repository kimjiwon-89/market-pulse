package com.marketpulse.infrastructure.token.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 외부 API 인증 토큰 공통 도메인
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiToken {

    private String provider;      // ex) STOCK_API
    private String accessToken;
    private LocalDateTime expiredAt;

    @JsonIgnore
    public boolean isExpired() {
        return expiredAt == null ||
                LocalDateTime.now().isAfter(expiredAt.minusMinutes(5));
    }
}