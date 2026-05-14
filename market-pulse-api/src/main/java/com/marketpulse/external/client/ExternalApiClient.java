package com.marketpulse.external.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.global.response.KisResponse;
import com.marketpulse.infrastructure.token.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 외부 API 인증 토큰 발급 Client
 *
 * 특정 증권사 종속 없음
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExternalApiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final AtomicLong lastCallTime = new AtomicLong(0);
    private static final long MIN_INTERVAL_MS = 210;

    @Value("${external.api.base-url}")
    private String baseUrl;

    @Value("${external.api.app-key}")
    private String appKey;

    @Value("${external.api.app-secret}")
    private String appSecret;

    @Value("${external.api.token-path}")
    private String tokenPath;

    private final TokenService tokenService;

    private synchronized void throttle() {
        long now = System.currentTimeMillis();
        long wait = MIN_INTERVAL_MS - (now - lastCallTime.get());
        if (wait > 0) {
            try { Thread.sleep(wait); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        lastCallTime.set(System.currentTimeMillis());
    }

    public <T> T callGet(
            String path,
            String trId,
            Map<String,String> params,
            ParameterizedTypeReference<T> type
    ){
        throttle();

        String token = tokenService.getValidToken();

        UriComponentsBuilder builder =
                UriComponentsBuilder.fromHttpUrl(baseUrl + path);

        params.forEach(builder::queryParam);

        HttpHeaders headers = new HttpHeaders();

        headers.setBearerAuth(token);
        headers.set("appkey", appKey);
        headers.set("appsecret", appSecret);
        headers.set("tr_id", trId);

        HttpEntity<?> entity =
                new HttpEntity<>(headers);

        try {
            ResponseEntity<T> response =
                    restTemplate.exchange(
                            builder.toUriString(),
                            HttpMethod.GET,
                            entity,
                            type
                    );

            try {
                String json = objectMapper.writeValueAsString(response.getBody());
                log.info("@@@ API CALL tr_id={}, URL={}, status={}, body={}", trId, path, response.getStatusCode(), json);
            } catch (Exception e) {
                log.info("@@@ API CALL tr_id={}, URL={}, status={}", trId, path, response.getStatusCode());
            }

            return response.getBody();
        } catch (HttpStatusCodeException e) {
            log.error("@@@ API ERROR tr_id={}, URL={}, status={}, body={}", trId, path, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }
}