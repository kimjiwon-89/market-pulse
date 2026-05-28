package com.marketpulse.domain.user.dto;

import com.marketpulse.domain.user.vo.UserVo;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponseDto {
    private Long id;
    private String username;
    private String role;
    private LocalDateTime createdAt;

    public static UserResponseDto from(UserVo vo) {
        return UserResponseDto.builder()
                .id(vo.getId())
                .username(vo.getUsername())
                .role(vo.getRole())
                .createdAt(vo.getCreatedAt())
                .build();
    }
}
