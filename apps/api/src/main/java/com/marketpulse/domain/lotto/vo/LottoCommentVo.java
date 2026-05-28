package com.marketpulse.domain.lotto.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LottoCommentVo {
    private Long id;
    private int drawNo;
    private String username;
    private String content;
    private String imageUrl;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
