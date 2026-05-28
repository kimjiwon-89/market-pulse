package com.marketpulse.domain.news.vo;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class NewsSnapshotVo {
    private Long id;
    private String newsNo;
    private LocalDate newsDate;
    private String newsTime;
    private String title;
    private String rawJson;
}
