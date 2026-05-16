package com.marketpulse.domain.lotto.mapper;

import com.marketpulse.domain.lotto.vo.LottoCommentVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LottoCommentMapper {
    void insert(LottoCommentVo vo);
    List<LottoCommentVo> findByDrawNo(@Param("drawNo") int drawNo);
    LottoCommentVo findById(@Param("id") Long id);
    void update(@Param("id") Long id, @Param("content") String content, @Param("imageUrl") String imageUrl);
    void softDelete(@Param("id") Long id);
}
