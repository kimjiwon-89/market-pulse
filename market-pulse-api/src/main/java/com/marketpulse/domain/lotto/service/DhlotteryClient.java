package com.marketpulse.domain.lotto.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.lotto.vo.LottoResultVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;

/**
 * 동행복권 공개 API 클라이언트 (인증 불필요)
 * https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={회차}
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DhlotteryClient {

    private static final String URL =
            "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public LottoResultVo fetch(int drawNo) {
        try {
            String json = restTemplate.getForObject(URL + drawNo, String.class);
            JsonNode node = objectMapper.readTree(json);

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
            log.error("dhlottery fetch error, drawNo={}", drawNo, e);
            return null;
        }
    }

    /** 최신 회차 번호 탐색 — 높은 번호부터 내려오며 첫 번째 유효 회차 반환 */
    public int findLatestDrawNo() {
        // 1회차: 2002-12-07, 매주 토요일 → 현재까지 회차 추정
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
