package com.marketpulse.domain.lotto.controller;

import com.marketpulse.domain.lotto.dto.LottoCommentRequestDto;
import com.marketpulse.domain.lotto.dto.LottoCommentResponseDto;
import com.marketpulse.domain.lotto.dto.LottoCommentUpdateDto;
import com.marketpulse.domain.lotto.service.LottoCommentService;
import com.marketpulse.global.response.ApiResponse;
import com.marketpulse.global.s3.S3UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Tag(name = "LottoComment", description = "로또 토론장")
@RestController
@RequestMapping("/api/lotto/comment")
@RequiredArgsConstructor
public class LottoCommentController {

    private final LottoCommentService commentService;
    private final S3UploadService s3UploadService;

    @Operation(summary = "회차별 댓글 목록")
    @GetMapping
    public ApiResponse<List<LottoCommentResponseDto>> list(
            @RequestParam int round,
            Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ApiResponse.success(commentService.getComments(round, username));
    }

    @Operation(summary = "댓글 등록")
    @PostMapping
    public ApiResponse<LottoCommentResponseDto> create(
            @RequestBody LottoCommentRequestDto req,
            Authentication auth) {
        return ApiResponse.success(commentService.create(req, auth.getName()));
    }

    @Operation(summary = "댓글 수정")
    @PatchMapping("/{id}")
    public ApiResponse<LottoCommentResponseDto> update(
            @PathVariable Long id,
            @RequestBody LottoCommentUpdateDto req,
            Authentication auth) {
        return ApiResponse.success(commentService.update(id, req, auth.getName()));
    }

    @Operation(summary = "댓글 삭제 (soft delete)")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            Authentication auth) {
        commentService.delete(id, auth.getName());
        return ApiResponse.success(null);
    }

    @Operation(summary = "이미지 S3 업로드")
    @PostMapping("/image")
    public ApiResponse<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        String url = s3UploadService.upload(file);
        return ApiResponse.success(Map.of("imageUrl", url));
    }
}
