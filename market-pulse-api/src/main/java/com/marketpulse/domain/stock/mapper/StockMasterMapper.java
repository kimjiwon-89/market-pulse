package com.marketpulse.domain.stock.mapper;

import com.marketpulse.domain.stock.vo.StockMasterVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StockMasterMapper {

    List<StockMasterVo> searchByName(@Param("q") String q, @Param("limit") int limit);

    void bulkUpsert(@Param("list") List<StockMasterVo> list);

    int count();
}
