package com.marketpulse.domain.lotto.dto;

import com.marketpulse.domain.lotto.vo.LottoCommentVo;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LottoCommentResponseDto {
    private Long id;
    private int drawNo;
    private String username;
    private String content;
    private String imageUrl;
    private boolean isOwner;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LottoCommentResponseDto from(LottoCommentVo vo, String currentUsername) {
        LottoCommentResponseDto dto = new LottoCommentResponseDto();
        dto.setId(vo.getId());
        dto.setDrawNo(vo.getDrawNo());
        dto.setUsername(vo.getUsername());
        dto.setContent(vo.getContent());
        dto.setImageUrl(vo.getImageUrl());
        dto.setOwner(currentUsername != null && currentUsername.equals(vo.getUsername()));
        dto.setCreatedAt(vo.getCreatedAt());
        dto.setUpdatedAt(vo.getUpdatedAt());
        return dto;
    }
}
