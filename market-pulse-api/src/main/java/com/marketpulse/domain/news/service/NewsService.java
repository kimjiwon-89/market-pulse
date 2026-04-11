package com.marketpulse.domain.news.service;

import com.marketpulse.domain.index.dto.IndexRequest;
import com.marketpulse.domain.index.dto.IndexResponse;
import com.marketpulse.domain.news.dto.NewsReqDto;
import com.marketpulse.domain.news.dto.NewsRespDto;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final ExternalApiClient externalApiClient;

    public List<NewsRespDto> callIndex(
            NewsReqDto request
    ){

        Map<String, String> params = new HashMap<>();

        params.put("FID_NEWS_OFER_ENTP_CODE",
                request.getFID_NEWS_OFER_ENTP_CODE() != null ? request.getFID_NEWS_OFER_ENTP_CODE().trim() : "");

        params.put("FID_COND_MRKT_CLS_CODE",
                request.getFID_COND_MRKT_CLS_CODE() != null ? request.getFID_COND_MRKT_CLS_CODE().trim() : "");

        params.put("FID_INPUT_ISCD",
                request.getFID_INPUT_ISCD() != null ? request.getFID_INPUT_ISCD().trim() : "");

        params.put("FID_TITL_CNTT",
                request.getFID_TITL_CNTT() != null ? request.getFID_TITL_CNTT().trim() : "");

        params.put("FID_INPUT_DATE_1",
                request.getFID_INPUT_DATE_1() != null ? request.getFID_INPUT_DATE_1().trim() : "");

        params.put("FID_INPUT_HOUR_1",
                request.getFID_INPUT_HOUR_1() != null ? request.getFID_INPUT_HOUR_1().trim() : "");

        params.put("FID_RANK_SORT_CLS_CODE",
                request.getFID_RANK_SORT_CLS_CODE() != null ? request.getFID_RANK_SORT_CLS_CODE().trim() : "");

        params.put("FID_INPUT_SRNO",
                request.getFID_INPUT_SRNO() != null ? request.getFID_INPUT_SRNO().trim() : "");

        KisResponse<List<NewsRespDto>> response =
                externalApiClient.callGet(
                        "/uapi/domestic-stock/v1/quotations/news-title",
                        "FHKST01011800",
                        params,
                        new ParameterizedTypeReference<
                                KisResponse<List<NewsRespDto>>>(){}
                );

        response.validate();

        return response.getOutput();
    }
}
