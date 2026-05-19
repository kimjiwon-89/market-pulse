package com.marketpulse.domain.memo.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MemoRecordVo {
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
