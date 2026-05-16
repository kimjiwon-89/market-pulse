package com.marketpulse.external.client;

import com.marketpulse.domain.stock.vo.KrxStockInfoVo;
import com.marketpulse.external.dto.KrxResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KrxApiClient {

    private final RestTemplate restTemplate;

    @Value("${krx.api.base-url}")
    private String baseUrl;

    @Value("${krx.api.auth-key}")
    private String authKey;

    public List<KrxStockInfoVo> fetchStockInfoList(String path, String basDd) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("AUTH_KEY", authKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("basDd", basDd), headers);

        try {
            ResponseEntity<KrxResponse<KrxStockInfoVo>> response = restTemplate.exchange(
                    baseUrl + path,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<KrxResponse<KrxStockInfoVo>>() {}
            );

            KrxResponse<KrxStockInfoVo> body = response.getBody();
            if (body == null || body.getOutBlock1() == null) {
                log.warn("KRX empty response: path={}, basDd={}", path, basDd);
                return List.of();
            }

            log.info("KRX fetch: path={}, basDd={}, count={}", path, basDd, body.getOutBlock1().size());
            return body.getOutBlock1();

        } catch (Exception e) {
            log.error("KRX API error: path={}, basDd={}, msg={}", path, basDd, e.getMessage());
            return List.of();
        }
    }
}
