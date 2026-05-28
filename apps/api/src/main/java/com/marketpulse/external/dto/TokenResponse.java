package com.marketpulse.external.dto;

import lombok.Getter;

/**
 * 한투 토큰 발급 API 응답 DTO
 *
 * 실제 응답 JSON:
 * {
 *   "access_token": "...",
 *   "expires_in": 86400
 * }
 */
@Getter
public class TokenResponse {

    private String access_token;
    private Long expires_in;

    public String getAccessToken() {
        return access_token;
    }

    public Long getExpiresIn() {
        return expires_in;
    }
}