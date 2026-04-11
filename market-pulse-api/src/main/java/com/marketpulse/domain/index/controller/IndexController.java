package com.marketpulse.domain.index.controller;

import com.marketpulse.domain.index.dto.IndexRequest;
import com.marketpulse.domain.index.dto.IndexResponse;
import com.marketpulse.domain.index.service.IndexService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "국내주식업종기간별시세", description = "J_국내주식업종기간별시세(일/주/월/년)")
@RestController
@RequestMapping("/api/index")
@RequiredArgsConstructor
public class IndexController {

    private final IndexService indexService;

    @Operation(summary = "국내 주식 업종 기간별시세")
    @GetMapping("/inquire-daily-indexchartprice")
    public ApiResponse<IndexResponse> index(@ParameterObject @ModelAttribute IndexRequest request){
        return ApiResponse.success(
                indexService.callIndex(request)
        );

    }

}
