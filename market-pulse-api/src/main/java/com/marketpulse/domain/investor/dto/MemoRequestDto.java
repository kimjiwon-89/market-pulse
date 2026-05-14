package com.marketpulse.domain.investor.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemoRequestDto {
    private String date;    // "YYYYMMDD"
    private String market;  // "KOSPI" | "KOSDAQ"
    private String content;
}
