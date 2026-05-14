package com.marketpulse.domain.investor.mapper;

import com.marketpulse.domain.investor.vo.MemoVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface MemoMapper {

    void upsert(MemoVo memo);

    MemoVo findByDateAndMarket(@Param("memoDate") LocalDate memoDate, @Param("market") String market);

    void deleteById(@Param("id") Long id);

    List<MemoVo> findList(@Param("market") String market, @Param("size") int size, @Param("offset") int offset);
}
