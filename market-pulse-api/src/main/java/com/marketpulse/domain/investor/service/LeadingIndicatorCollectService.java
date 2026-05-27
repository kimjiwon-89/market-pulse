package com.marketpulse.domain.investor.service;

import com.marketpulse.domain.investor.mapper.LeadingSnapshotMapper;
import com.marketpulse.domain.investor.vo.MarketLeadingSnapshotVo;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.external.client.KrxApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadingIndicatorCollectService {

    private final KrxApiClient krxApiClient;
    private final MarketDailyPriceMapper priceMapper;
    private final LeadingSnapshotMapper leadingSnapshotMapper;

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;

    private static final String LVRG_CODE = "122630";   // KODEX 레버리지
    private static final String INVRS_CODE = "114800";  // KODEX 인버스

    public void collect(LocalDate date) {
        String basDd = date.format(BASIC);
        collectShortSell(date, basDd, "KOSPI",  "/short/srt_bydd_trd");
        collectShortSell(date, basDd, "KOSDAQ", "/short/srt_ksq_bydd_trd");
        collectEtfVolumes(date);
    }

    private void collectShortSell(LocalDate date, String basDd, String market, String path) {
        try {
            List<Map<String, Object>> rows = krxApiClient.fetchRows(path, basDd);
            if (rows.isEmpty()) {
                log.warn("Short sell data empty: market={}, date={}", market, date);
                return;
            }
            long totalVol = rows.stream().mapToLong(r -> parseLong(r, "ACC_TRDVOL")).sum();
            long totalAmt = rows.stream().mapToLong(r -> parseLong(r, "ACC_TRDVAL")).sum();

            MarketLeadingSnapshotVo vo = new MarketLeadingSnapshotVo();
            vo.setSnapDate(date);
            vo.setMarket(market);
            vo.setShortSellVol(totalVol);
            vo.setShortSellAmt(totalAmt);
            leadingSnapshotMapper.upsert(vo);
            log.info("Short sell saved: market={}, vol={}, amt={}", market, totalVol, totalAmt);
        } catch (Exception e) {
            log.error("Short sell collect failed: market={}: {}", market, e.getMessage());
        }
    }

    private void collectEtfVolumes(LocalDate date) {
        try {
            List<MarketDailyPriceVo> lvrgRows  = priceMapper.findByCodeAndDateRange(LVRG_CODE,  "ETF", date, date);
            List<MarketDailyPriceVo> invrsRows  = priceMapper.findByCodeAndDateRange(INVRS_CODE, "ETF", date, date);

            Long lvrgVol  = lvrgRows.isEmpty()  ? null : lvrgRows.get(0).getVolume();
            Long invrsVol = invrsRows.isEmpty() ? null : invrsRows.get(0).getVolume();

            if (lvrgVol == null && invrsVol == null) {
                log.warn("ETF volumes not in DB for date={} — will populate once ETF collection added", date);
                return;
            }

            MarketLeadingSnapshotVo vo = new MarketLeadingSnapshotVo();
            vo.setSnapDate(date);
            vo.setMarket("ALL");
            vo.setLvrgVol(lvrgVol);
            vo.setInvrsVol(invrsVol);
            leadingSnapshotMapper.upsert(vo);
            log.info("ETF volumes saved: date={}, lvrg={}, invrs={}", date, lvrgVol, invrsVol);
        } catch (Exception e) {
            log.error("ETF volume collect failed: date={}: {}", date, e.getMessage());
        }
    }

    private long parseLong(Map<String, Object> row, String key) {
        Object val = row.get(key);
        if (val == null) return 0L;
        try { return Long.parseLong(String.valueOf(val).replace(",", "").trim()); }
        catch (NumberFormatException e) { return 0L; }
    }
}
