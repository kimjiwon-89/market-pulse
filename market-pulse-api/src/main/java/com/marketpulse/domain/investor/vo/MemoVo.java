package com.marketpulse.domain.investor.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class MemoVo {
    private Long id;
    private LocalDate memoDate;
    private String market;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
