package com.marketpulse.domain.investor.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class MemoResponseDto {
    private Long id;
    private LocalDate memoDate;
    private String market;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
