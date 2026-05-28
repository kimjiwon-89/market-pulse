package com.marketpulse.domain.user.controller;

import com.marketpulse.domain.user.dto.UserChangePasswordRequest;
import com.marketpulse.domain.user.dto.UserCreateRequest;
import com.marketpulse.domain.user.service.UserService;
import com.marketpulse.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin", description = "관리자 - 사용자 관리")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "사용자 목록 조회")
    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAll()));
    }

    @Operation(summary = "사용자 추가")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserCreateRequest req) {
        try {
            return ResponseEntity.ok(ApiResponse.success(userService.create(req)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @Operation(summary = "사용자 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        try {
            userService.delete(id, auth.getName());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id,
                                            @RequestBody UserChangePasswordRequest req) {
        userService.changePassword(id, req);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
