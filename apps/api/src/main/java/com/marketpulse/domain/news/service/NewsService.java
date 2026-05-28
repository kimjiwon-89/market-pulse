package com.marketpulse.domain.news.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.news.dto.NewsReqDto;
import com.marketpulse.domain.news.dto.NewsRespDto;
import com.marketpulse.domain.news.mapper.NewsMapper;
import com.marketpulse.domain.news.vo.NewsSnapshotVo;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsService {

    private final ExternalApiClient externalApiClient;
    private final NewsMapper newsMapper;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /* ── 조회: DB에서 읽기 ── */

    public List<NewsRespDto> callIndex(NewsReqDto request) {
        int limit = (request.getLimit() != null && request.getLimit() > 0) ? request.getLimit() : 20;
        try {
            List<NewsSnapshotVo> vos = newsMapper.findLatest(limit);
            if (vos.isEmpty()) {
                log.info("No news in DB, fetching from KIS API");
                fetchAndSave();
                vos = newsMapper.findLatest(limit);
            }
            List<NewsRespDto> result = new ArrayList<>();
            for (NewsSnapshotVo vo : vos) {
                try {
                    result.add(objectMapper.readValue(vo.getRawJson(), NewsRespDto.class));
                } catch (Exception e) {
                    log.warn("Failed to deserialize news rawJson for news_no={}: {}", vo.getNewsNo(), e.getMessage());
                }
            }
            if (result.isEmpty()) {
                log.warn("No news data available after fetch attempt");
                return List.of();
            }
            return result;
        } catch (Exception e) {
            log.error("Error in callIndex (news): {}", e.getMessage());
            return List.of();
        }
    }

    /* ── 수집: KIS API 호출 후 DB 저장 (스케줄러에서 호출) ── */

    public void fetchAndSave() {
        try {
            String today = LocalDate.now().format(FMT);

            Map<String, String> params = new HashMap<>();
            params.put("FID_NEWS_OFER_ENTP_CODE", "");
            params.put("FID_COND_MRKT_CLS_CODE", "");
            params.put("FID_INPUT_ISCD", "");
            params.put("FID_TITL_CNTT", "");
            params.put("FID_INPUT_DATE_1", today);
            params.put("FID_INPUT_HOUR_1", "000000");
            params.put("FID_RANK_SORT_CLS_CODE", "0");
            params.put("FID_INPUT_SRNO", "");

            KisResponse<List<NewsRespDto>> response = externalApiClient.callGet(
                    "/uapi/domestic-stock/v1/quotations/news-title",
                    "FHKST01011800",
                    params,
                    new ParameterizedTypeReference<KisResponse<List<NewsRespDto>>>() {}
            );
            response.validate();

            List<NewsRespDto> items = response.getOutput();
            if (items == null || items.isEmpty()) {
                log.info("No news from KIS API today");
                return;
            }

            List<NewsSnapshotVo> vos = new ArrayList<>();
            for (NewsRespDto item : items) {
                if (item.getCntt_usiq_srno() == null) continue;
                try {
                    NewsSnapshotVo vo = new NewsSnapshotVo();
                    vo.setNewsNo(item.getCntt_usiq_srno());
                    if (item.getData_dt() != null && item.getData_dt().length() == 8) {
                        vo.setNewsDate(LocalDate.parse(item.getData_dt(), FMT));
                    }
                    vo.setNewsTime(item.getData_tm());
                    vo.setTitle(item.getHts_pbnt_titl_cntt());
                    vo.setRawJson(objectMapper.writeValueAsString(item));
                    vos.add(vo);
                } catch (Exception e) {
                    log.warn("Failed to serialize news item: {}", e.getMessage());
                }
            }

            if (!vos.isEmpty()) {
                newsMapper.bulkUpsert(vos);
                log.info("News snapshot saved: {} items", vos.size());
            }
        } catch (Exception e) {
            log.error("News snapshot failed: {}", e.getMessage());
        }
    }
}
