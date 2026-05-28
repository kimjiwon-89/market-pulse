package com.marketpulse.domain.lotto.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.lotto.vo.LottoResultVo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;

@Slf4j
@Component
public class DhlotteryClient {

    private static final String URL =
            "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public DhlotteryClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        // 타임아웃 5초 설정 — 기본 RestTemplate은 무한 대기
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(5_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public LottoResultVo fetch(int drawNo) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            headers.set(HttpHeaders.REFERER, "https://www.dhlottery.co.kr/");
            headers.set(HttpHeaders.ACCEPT, "application/json, text/plain, */*");
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "ko-KR,ko;q=0.9");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> resp = restTemplate.exchange(
                    URL + drawNo, HttpMethod.GET, entity, String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.warn("dhlottery non-2xx, drawNo={}, status={}", drawNo, resp.getStatusCode());
                return null;
            }

            JsonNode node = objectMapper.readTree(resp.getBody());
            if (!"success".equals(node.path("returnValue").asText())) {
                log.warn("dhlottery returnValue not success, drawNo={}", drawNo);
                return null;
            }

            LottoResultVo vo = new LottoResultVo();
            vo.setDrawNo(node.path("drwNo").asInt());
            vo.setDrawDate(LocalDate.parse(node.path("drwNoDate").asText()));
            vo.setNo1(node.path("drwtNo1").asInt());
            vo.setNo2(node.path("drwtNo2").asInt());
            vo.setNo3(node.path("drwtNo3").asInt());
            vo.setNo4(node.path("drwtNo4").asInt());
            vo.setNo5(node.path("drwtNo5").asInt());
            vo.setNo6(node.path("drwtNo6").asInt());
            vo.setBonusNo(node.path("bnusNo").asInt());
            return vo;

        } catch (Exception e) {
            log.warn("dhlottery fetch failed, drawNo={}: {}", drawNo, e.getMessage());
            return null;
        }
    }

    public int findLatestDrawNo() {
        long weeks = java.time.temporal.ChronoUnit.WEEKS.between(
                LocalDate.of(2002, 12, 7), LocalDate.now());
        int estimated = (int) weeks + 1;

        for (int no = estimated + 2; no >= estimated - 2; no--) {
            LottoResultVo vo = fetch(no);
            if (vo != null) return vo.getDrawNo();
        }
        return estimated;
    }
}
