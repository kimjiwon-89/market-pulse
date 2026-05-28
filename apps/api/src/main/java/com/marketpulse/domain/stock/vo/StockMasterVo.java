package com.marketpulse.domain.stock.vo;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMasterVo {

    private String code;    // 단축코드 6자리
    private String name;    // 종목명 (약명 우선)
    private String market;  // KOSPI | KOSDAQ | KONEX
    private String sector;  // 소속부 (없으면 null)
}
