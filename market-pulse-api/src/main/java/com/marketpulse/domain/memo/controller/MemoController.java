package com.marketpulse.domain.memo.controller;

import com.marketpulse.domain.memo.dto.MemoCreateRequest;
import com.marketpulse.domain.memo.dto.MemoRecordResponse;
import com.marketpulse.domain.memo.dto.MemoUpdateRequest;
import com.marketpulse.domain.memo.service.MemoService;
import com.marketpulse.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memo")
@RequiredArgsConstructor
public class MemoController {

    private final MemoService memoService;

    @GetMapping
    public ApiResponse<List<MemoRecordResponse>> list(
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String stockCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            Authentication auth
    ) {
        return ApiResponse.success(
                memoService.findList(auth.getName(), sourceType, from, to, market, stockCode, keyword, page, size)
        );
    }

    @GetMapping("/context")
    public ApiResponse<List<MemoRecordResponse>> context(
            @RequestParam String sourceType,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String stockCode,
            Authentication auth
    ) {
        return ApiResponse.success(memoService.findContext(auth.getName(), sourceType, date, market, stockCode));
    }

    @PostMapping
    public ApiResponse<MemoRecordResponse> create(@RequestBody MemoCreateRequest req, Authentication auth) {
        return ApiResponse.success(memoService.create(req, auth.getName()));
    }

    @PatchMapping("/{id}")
    public ApiResponse<MemoRecordResponse> update(
            @PathVariable Long id,
            @RequestBody MemoUpdateRequest req,
            Authentication auth
    ) {
        return ApiResponse.success(memoService.update(id, req, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, Authentication auth) {
        memoService.delete(id, auth.getName());
        return ApiResponse.success(null);
    }
}
