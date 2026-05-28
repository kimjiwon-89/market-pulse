package com.marketpulse.domain.stock.service;

import com.marketpulse.domain.stock.dto.StockSearchResultDto;
import com.marketpulse.domain.stock.mapper.StockMasterMapper;
import com.marketpulse.domain.stock.vo.KrxStockInfoVo;
import com.marketpulse.domain.stock.vo.StockMasterVo;
import com.marketpulse.external.client.KrxApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockMasterService {

    private final KrxApiClient krxApiClient;
    private final StockMasterMapper stockMasterMapper;

    private static final String PATH_KOSPI  = "/sto/stk_isu_base_info";
    private static final String PATH_KOSDAQ = "/sto/ksq_isu_base_info";
    private static final String PATH_KONEX  = "/sto/knx_isu_base_info";
    private static final int BATCH_SIZE = 500;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public List<StockSearchResultDto> search(String q, int limit) {
        return stockMasterMapper.searchByName(q, limit).stream()
                .map(v -> StockSearchResultDto.builder()
                        .code(v.getCode())
                        .name(v.getName())
                        .market(v.getMarket())
                        .sector(v.getSector())
                        .build())
                .toList();
    }

    // 자정 스케줄러 호출 — 어제 날짜 기준 (장 마감 후 데이터 확정)
    public void updateAll() {
        String basDd = LocalDate.now().minusDays(1).format(FMT);
        updateAll(basDd);
    }

    public void updateAll(String basDd) {
        List<StockMasterVo> all = new ArrayList<>();
        all.addAll(fetchAndConvert(PATH_KOSPI,  basDd));
        all.addAll(fetchAndConvert(PATH_KOSDAQ, basDd));
        all.addAll(fetchAndConvert(PATH_KONEX,  basDd));

        if (all.isEmpty()) {
            log.warn("KRX stock info empty for basDd={}, skipping update", basDd);
            return;
        }

        for (int i = 0; i < all.size(); i += BATCH_SIZE) {
            stockMasterMapper.bulkUpsert(all.subList(i, Math.min(i + BATCH_SIZE, all.size())));
        }
        log.info("stock_master updated: {} records (basDd={})", all.size(), basDd);
    }

    private List<StockMasterVo> fetchAndConvert(String path, String basDd) {
        List<KrxStockInfoVo> items = krxApiClient.fetchStockInfoList(path, basDd);
        return items.stream()
                .filter(v -> v.getIsuSrtCd() != null && !v.getIsuSrtCd().isBlank())
                .map(v -> StockMasterVo.builder()
                        .code(v.getIsuSrtCd().trim())
                        .name(resolveName(v))
                        .market(resolveMarket(v.getMktTpNm()))
                        .sector(resolveSector(v.getSectTpNm()))
                        .build())
                .toList();
    }

    private String resolveName(KrxStockInfoVo v) {
        String abbrv = v.getIsuAbbrv();
        return (abbrv != null && !abbrv.isBlank() && !"-".equals(abbrv.trim()))
                ? abbrv.trim()
                : (v.getIsuNm() != null ? v.getIsuNm().trim() : "");
    }

    private String resolveMarket(String mktTpNm) {
        if (mktTpNm == null) return "UNKNOWN";
        return switch (mktTpNm.trim()) {
            case "유가증권" -> "KOSPI";
            case "코스닥"  -> "KOSDAQ";
            case "코넥스"  -> "KONEX";
            default        -> mktTpNm.trim();
        };
    }

    private String resolveSector(String sectTpNm) {
        if (sectTpNm == null || sectTpNm.isBlank() || "-".equals(sectTpNm.trim())) return null;
        return sectTpNm.trim();
    }
}
