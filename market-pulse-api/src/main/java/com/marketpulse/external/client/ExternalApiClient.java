package com.marketpulse.external.client;

import com.marketpulse.infrastructure.token.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * 외부 API 인증 토큰 발급 Client
 *
 * 특정 증권사 종속 없음
 */
@Component
@RequiredArgsConstructor
public class ExternalApiClient {

    private final RestTemplate restTemplate;

    @Value("${external.api.base-url}")
    private String baseUrl;

    @Value("${external.api.app-key}")
    private String appKey;

    @Value("${external.api.app-secret}")
    private String appSecret;

    @Value("${external.api.token-path}")
    private String tokenPath;

    private final TokenService tokenService;


    public String callGet(
            String path,
            String trId,
            Map<String, String> queryParams
    ) {

        String token = tokenService.getValidToken();

        UriComponentsBuilder builder =
                UriComponentsBuilder.fromHttpUrl(baseUrl + path);

        queryParams.forEach(builder::queryParam);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("appkey", appKey);
        headers.set("appsecret", appSecret);
        headers.set("tr_id", trId);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response =
                restTemplate.exchange(
                        builder.toUriString(),
                        HttpMethod.GET,
                        entity,
                        String.class
                );

        return response.getBody();
    }
}