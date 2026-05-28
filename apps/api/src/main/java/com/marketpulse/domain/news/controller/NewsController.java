package com.marketpulse.domain.news.controller;

import com.marketpulse.domain.index.dto.IndexRequest;
import com.marketpulse.domain.index.dto.IndexResponse;
import com.marketpulse.domain.index.service.IndexService;
import com.marketpulse.domain.news.dto.NewsReqDto;
import com.marketpulse.domain.news.dto.NewsRespDto;
import com.marketpulse.domain.news.service.NewsService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "뉴스", description = "뉴스")
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @Operation(summary = "국내 주식 업종 기간별시세")
    @GetMapping("/inquire-daily-news")
    public ApiResponse<List<NewsRespDto>> index(@ParameterObject @ModelAttribute NewsReqDto request){

        List<NewsRespDto> result = newsService.callIndex(request);

        return ApiResponse.success(result);

    }

}
