package com.marketpulse.domain.index.mapper;

import com.marketpulse.domain.index.vo.IndexSnapshotVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface IndexMapper {
    void upsert(IndexSnapshotVo vo);
    IndexSnapshotVo findLatest(@Param("indexCode") String indexCode);
    List<IndexSnapshotVo> findLatestByCodes(@Param("codes") List<String> codes);
}
