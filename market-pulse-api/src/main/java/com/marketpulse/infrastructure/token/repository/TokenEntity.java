package com.marketpulse.infrastructure.token.repository;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TokenEntity {
    private Long id;
    private String accessToken;
    private LocalDateTime expiredAt;
}
