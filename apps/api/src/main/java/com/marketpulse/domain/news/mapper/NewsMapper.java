package com.marketpulse.domain.news.mapper;

import com.marketpulse.domain.news.vo.NewsSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NewsMapper {
    void bulkUpsert(@Param("list") List<NewsSnapshotVo> list);
    List<NewsSnapshotVo> findLatest(@Param("limit") int limit);
}
