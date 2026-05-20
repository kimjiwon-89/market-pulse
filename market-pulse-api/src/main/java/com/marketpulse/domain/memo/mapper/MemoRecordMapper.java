package com.marketpulse.domain.memo.mapper;

import com.marketpulse.domain.memo.vo.MemoRecordVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface MemoRecordMapper {

    void insert(MemoRecordVo vo);

    MemoRecordVo findByIdAndUsername(@Param("id") Long id, @Param("username") String username);

    List<MemoRecordVo> findList(
            @Param("username") String username,
            @Param("sourceType") String sourceType,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("market") String market,
            @Param("stockCode") String stockCode,
            @Param("keyword") String keyword,
            @Param("size") int size,
            @Param("offset") int offset
    );

    List<MemoRecordVo> findContext(
            @Param("username") String username,
            @Param("sourceType") String sourceType,
            @Param("memoDate") LocalDate memoDate,
            @Param("market") String market,
            @Param("stockCode") String stockCode
    );

    int update(
            @Param("id") Long id,
            @Param("username") String username,
            @Param("title") String title,
            @Param("content") String content
    );

    int delete(@Param("id") Long id, @Param("username") String username);
}
