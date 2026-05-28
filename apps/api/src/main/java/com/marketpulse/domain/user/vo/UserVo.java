package com.marketpulse.domain.user.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserVo {
    private Long id;
    private String username;
    private String passwordHash;
    private String role;
    private LocalDateTime createdAt;
}
