package com.marketpulse.domain.memo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MemoCreateRequest {
    private String memoDate;
    private String sourceType;
    private String market;
    private String stockCode;
    private String stockName;
    private String title;
    private String content;
}
