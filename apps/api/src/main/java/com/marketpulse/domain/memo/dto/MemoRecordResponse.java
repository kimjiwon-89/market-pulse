package com.marketpulse.domain.memo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class MemoRecordResponse {
    private Long id;
    private String username;
    private LocalDate memoDate;
    private String sourceType;
    private String market;
    private String stockCode;
    private String stockName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
