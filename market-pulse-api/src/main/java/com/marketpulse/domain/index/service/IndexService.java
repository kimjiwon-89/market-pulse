package com.marketpulse.domain.index.service;

import com.marketpulse.domain.index.dto.IndexRequest;
import com.marketpulse.domain.index.dto.IndexResponse;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class IndexService {

    private final ExternalApiClient externalApiClient;

    public IndexResponse callIndex(
            IndexRequest request
    ){

        Map<String,String> params = Map.of(
                "fid_cond_mrkt_div_code","U",
                "fid_input_iscd",request.getFid_input_iscd(),
                "fid_input_date_1",request.getFid_input_date_1(),
                "fid_input_date_2",request.getFid_input_date_2(),
                "fid_period_div_code","D"
        );

        IndexResponse response =
                externalApiClient.callGet(
                        "/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice",
                        "FHKUP03500100",
                        params,
                        new ParameterizedTypeReference<IndexResponse>(){}
                );

        response.validate();

        return response;
    }
}
