package com.marketpulse.infrastructure.token.client;

import com.marketpulse.infrastructure.token.domain.ApiToken;
import com.marketpulse.infrastructure.token.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 외부 API 인증 토큰 발급 Client
 *
 * 특정 증권사 종속 없음
 */
@Component
@RequiredArgsConstructor
public class TokenApiClient {

    private final RestTemplate restTemplate;

    @Value("${external.api.base-url}")
    private String baseUrl;

    @Value("${external.api.app-key}")
    private String appKey;

    @Value("${external.api.app-secret}")
    private String appSecret;

    @Value("${external.api.token-path}")
    private String tokenPath;

    /**
     * 토큰 발급 전용
     * @return
     */
    public ApiToken issueToken() {

        String url = baseUrl + tokenPath;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("grant_type", "client_credentials");
        body.put("appkey", appKey);
        body.put("appsecret", appSecret);

        HttpEntity<Map<String, String>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<TokenResponse> response =
                restTemplate.postForEntity(url, request, TokenResponse.class);

        TokenResponse tokenResponse = response.getBody();

        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
            throw new IllegalStateException("토큰 발급 실패");
        }

        LocalDateTime expiredAt =
                LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn());

        return ApiToken.builder()
                .accessToken(tokenResponse.getAccessToken())
                .expiredAt(expiredAt)
                .build();
    }

}