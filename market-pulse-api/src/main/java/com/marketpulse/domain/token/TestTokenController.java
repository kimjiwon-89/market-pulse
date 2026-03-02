package com.marketpulse.domain.token;

import com.marketpulse.global.response.ApiResponse;
import com.marketpulse.infrastructure.token.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Test Token API", description = "토큰 발급 테스트 전용 API")
@RestController
@RequiredArgsConstructor
public class TestTokenController {

    private final TokenService tokenService;

    @Operation(summary = "토큰 발급 테스트", description = "현재 저장된 토큰을 반환하거나, 없으면 신규 발급합니다.")
    @GetMapping("/test/token")
    public ApiResponse<String> issueToken() {
        String token = tokenService.getValidToken();
        return ApiResponse.success(token, "successfully");
    }
}