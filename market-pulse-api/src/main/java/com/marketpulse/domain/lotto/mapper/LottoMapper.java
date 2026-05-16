package com.marketpulse.domain.lotto.mapper;

import com.marketpulse.domain.lotto.vo.LottoAnalysisPoolVo;
import com.marketpulse.domain.lotto.vo.LottoAnalysisResultVo;
import com.marketpulse.domain.lotto.vo.LottoResultVo;
import com.marketpulse.domain.lotto.vo.LottoUserComboVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LottoMapper {

    // lotto_result
    void insertResult(LottoResultVo vo);
    LottoResultVo findResultByDrawNo(@Param("drawNo") int drawNo);
    List<LottoResultVo> findRecentResults(@Param("limit") int limit);
    List<LottoResultVo> findAllResults();
    Integer findLatestDrawNo();

    // lotto_analysis_pool
    void upsertPool(LottoAnalysisPoolVo vo);
    List<LottoAnalysisPoolVo> findPoolsByDrawNo(@Param("drawNo") int drawNo);
    List<LottoAnalysisPoolVo> findAllPools();

    // lotto_analysis_result
    void upsertAnalysisResult(LottoAnalysisResultVo vo);
    List<LottoAnalysisResultVo> findAnalysisResultsByDrawNo(@Param("drawNo") int drawNo);
    List<LottoAnalysisResultVo> findAllAnalysisResults();

    // lotto_user_combo
    void insertUserCombo(LottoUserComboVo vo);
    List<LottoUserComboVo> findUserCombos();
    void updateUserComboHitCount(@Param("id") Long id, @Param("hitCount") int hitCount);
    void deleteUserCombo(@Param("id") Long id);
}
