package com.marketpulse.domain.stock.service;

import com.marketpulse.domain.stock.dto.ForeignTradeRequest;
import com.marketpulse.domain.stock.dto.ForeignTradeItem;
import com.marketpulse.external.client.ExternalApiClient;
import com.marketpulse.global.response.KisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockService {

    private final ExternalApiClient externalApiClient;

    public List<ForeignTradeItem> callForeignTrade(ForeignTradeRequest request) {

        Map<String, String> params = Map.of(
                "FID_COND_MRKT_DIV_CODE", request.getFID_COND_MRKT_DIV_CODE(),
                "FID_COND_SCR_DIV_CODE", request.getFID_COND_SCR_DIV_CODE(),
                "FID_INPUT_ISCD", request.getFID_INPUT_ISCD(),
                "FID_RANK_SORT_CLS_CODE", request.getFID_RANK_SORT_CLS_CODE(),
                "FID_RANK_SORT_CLS_CODE_2", request.getFID_RANK_SORT_CLS_CODE_2()
        );

        KisResponse<List<ForeignTradeItem>> response =
                externalApiClient.callGet(
                    "/uapi/domestic-stock/v1/quotations/frgnmem-trade-estimate",
                    "FHKST644100C0",
                    params,
                    new ParameterizedTypeReference<
                        KisResponse<List<ForeignTradeItem>>
                    >(){}
                );

        response.validate();

        return response.getOutput();
    }
}