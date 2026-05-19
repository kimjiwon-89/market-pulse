package com.marketpulse.domain.memo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MemoUpdateRequest {
    private String title;
    private String content;
}
