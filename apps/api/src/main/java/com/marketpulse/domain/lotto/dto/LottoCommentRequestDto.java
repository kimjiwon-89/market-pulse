package com.marketpulse.domain.lotto.dto;

import lombok.Data;

@Data
public class LottoCommentRequestDto {
    private int drawNo;
    private String content;
    private String imageUrl;
}
