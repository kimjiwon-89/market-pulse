package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.quant.live.dto.BullV4ReplayCacheStatusDto;
import com.marketpulse.domain.quant.live.dto.BullV4ReplayPrecomputeResultDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.mapper.QuantBullV4ReplayFactMapper;
import com.marketpulse.domain.quant.vo.MonthlyPickVo;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayCacheStatusVo;
import com.marketpulse.domain.quant.vo.QuantBullV4ReplayFactVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BullV4ReplayPrecomputeService {
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BullV4ReplayConfig DEFAULT_CONFIG = BullV4ReplayConfig.BALANCED_PAPER;
    private static final int DAILY_REFRESH_LOOKBACK_DAYS = 120;

    private final MarketDailyPriceMapper priceMapper;
    private final QuantBullV4ReplayFactMapper factMapper;

    @Transactional
    public BullV4ReplayPrecomputeResultDto precompute(LocalDate fromDate, LocalDate toDate) {
        int deleted = factMapper.deleteByConfigAndExitDateRange(DEFAULT_CONFIG.configKey(), fromDate, toDate);
        List<QuantBullV4ReplayFactVo> facts = priceMapper.findBullV4PaperReplayPicks(fromDate, toDate)
                .stream()
                .map(this::toFact)
                .toList();
        int inserted = facts.isEmpty() ? 0 : factMapper.upsertBatch(facts);
        return new BullV4ReplayPrecomputeResultDto(
                DEFAULT_CONFIG.modelCode(),
                DEFAULT_CONFIG.modelVersion(),
                DEFAULT_CONFIG.configKey(),
                fromDate,
                toDate,
                deleted,
                inserted
        );
    }

    public BullV4ReplayPrecomputeResultDto precomputeDaily(LocalDate targetDate) {
        return precompute(targetDate.minusDays(DAILY_REFRESH_LOOKBACK_DAYS), targetDate);
    }

    public BullV4ReplayCacheStatusDto cacheStatus() {
        QuantBullV4ReplayCacheStatusVo status = factMapper.findCacheStatus(DEFAULT_CONFIG.configKey());
        long cachedRows = status == null || status.getCachedRows() == null ? 0L : status.getCachedRows();
        return new BullV4ReplayCacheStatusDto(
                DEFAULT_CONFIG.modelCode(),
                DEFAULT_CONFIG.modelVersion(),
                DEFAULT_CONFIG.configKey(),
                cachedRows,
                status == null ? null : status.getFirstExitDate(),
                status == null ? null : status.getLatestExitDate(),
                status == null ? null : status.getLatestUpdatedAt(),
                cachedRows > 0
        );
    }

    private QuantBullV4ReplayFactVo toFact(MonthlyPickVo pick) {
        BigDecimal returnPct = pick.getSellPrice()
                .subtract(pick.getBuyPrice())
                .divide(pick.getBuyPrice(), 8, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED)
                .setScale(6, RoundingMode.HALF_UP);
        BigDecimal pnl = DEFAULT_CONFIG.positionCash()
                .multiply(returnPct)
                .divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP);

        QuantBullV4ReplayFactVo fact = new QuantBullV4ReplayFactVo();
        fact.setConfigKey(DEFAULT_CONFIG.configKey());
        fact.setSignalDate(null);
        fact.setEntryCheckDate(null);
        fact.setEntryDate(pick.getRebalanceDate());
        fact.setExitDate(pick.getExitDate());
        fact.setAssetCode(pick.getAssetCode());
        fact.setAssetName(pick.getAssetName());
        fact.setEntryPrice(pick.getBuyPrice());
        fact.setExitPrice(pick.getSellPrice());
        fact.setReturnPct(returnPct);
        fact.setScore(pick.getScore());
        fact.setExitReason("BULL_V4_RULE_EXIT");
        fact.setPositionCash(DEFAULT_CONFIG.positionCash());
        fact.setPnlKrw(pnl);
        fact.setCapitalReturnPct(null);
        return fact;
    }
}
