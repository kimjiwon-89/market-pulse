package com.marketpulse.domain.quant.service;

import com.marketpulse.domain.quant.dto.CollectStatusDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import com.marketpulse.domain.quant.vo.MarketDailyPriceVo;
import com.marketpulse.external.client.KrxApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuantCollectService {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private final KrxApiClient krxApiClient;
    private final MarketDailyPriceMapper priceMapper;
    private final JdbcTemplate jdbcTemplate;
    private final AtomicReference<CollectStatusDto> status = new AtomicReference<>(CollectStatusDto.idle());

    public CollectStatusDto collect(String from, String to, String dataType) {
        LocalDate fromDate = LocalDate.parse(from, BASIC);
        LocalDate toDate = LocalDate.parse(to, BASIC);
        List<LocalDate> dates = dateRange(fromDate, toDate);
        if (dates.size() <= 10) {
            return collectRange(dates, normalizeType(dataType));
        }
        CollectStatusDto running = new CollectStatusDto("RUNNING", 0, 0, dates.size(), 0, null, "백그라운드 수집 시작");
        status.set(running);
        CompletableFuture.runAsync(() -> collectRange(dates, normalizeType(dataType)));
        return running;
    }

    public CollectStatusDto getStatus() {
        return status.get();
    }

    private CollectStatusDto collectRange(List<LocalDate> dates, String dataType) {
        int processed = 0;
        int collected = 0;
        int skipped = 0;
        try {
            for (LocalDate date : dates) {
                boolean alreadyCollected = isAlreadyCollected(date, dataType);
                if (alreadyCollected) {
                    skipped++;
                } else {
                    List<MarketDailyPriceVo> rows = fetchFromKrx(date, dataType);
                    rows = dedupe(rows);
                    if (!rows.isEmpty()) {
                        priceMapper.upsertBatch(rows);
                    }
                    Thread.sleep(500);
                }
                collected++;
                processed++;
                status.set(new CollectStatusDto(
                        "RUNNING",
                        dates.isEmpty() ? 1 : processed / (double) dates.size(),
                        processed,
                        dates.size(),
                        collected,
                        date.format(BASIC),
                        skipped > 0 ? "이미 수집된 날짜 " + skipped + "건 스킵" : null
                ));
            }
            invalidateBacktestCache(dates);
            CollectStatusDto done = new CollectStatusDto("DONE", 1, processed, dates.size(), collected,
                    dates.isEmpty() ? null : dates.get(dates.size() - 1).format(BASIC),
                    skipped > 0 ? "수집 완료 (스킵 " + skipped + "건)" : "수집 완료");
            status.set(done);
            return done;
        } catch (Exception e) {
            log.error("Quant collect failed", e);
            CollectStatusDto error = new CollectStatusDto("ERROR", dates.isEmpty() ? 0 : processed / (double) dates.size(),
                    processed, dates.size(), collected, processed == 0 ? null : dates.get(processed - 1).format(BASIC), e.getMessage());
            status.set(error);
            return error;
        }
    }

    private List<MarketDailyPriceVo> fetchFromKrx(LocalDate date, String dataType) {
        String basDd = date.format(BASIC);
        List<MarketDailyPriceVo> rows = new ArrayList<>();
        if ("ALL".equals(dataType) || "INDEX".equals(dataType)) {
            rows.addAll(fetchEndpoint("/idx/kospi_dd_trd", basDd, "INDEX", "KOSPI"));
            rows.addAll(fetchEndpoint("/idx/kosdaq_dd_trd", basDd, "INDEX", "KOSDAQ"));
        }
        if ("ALL".equals(dataType) || "STOCK".equals(dataType)) {
            rows.addAll(fetchEndpoint("/sto/stk_bydd_trd", basDd, "STOCK", "KOSPI"));
            rows.addAll(fetchEndpoint("/sto/ksq_bydd_trd", basDd, "STOCK", "KOSDAQ"));
        }
        if ("ALL".equals(dataType) || "BOND".equals(dataType)) {
            rows.addAll(fetchEndpoint("/bon/kts_bydd_trd", basDd, "BOND", "BOND"));
        }
        if ("ALL".equals(dataType) || "GOLD".equals(dataType)) {
            rows.addAll(fetchEndpoint("/gen/gold_bydd_trd", basDd, "GOLD", "GOLD"));
        }
        if ("ETF".equals(dataType)) {
            rows.addAll(fetchEndpoint("/eto/etf_bydd_trd", basDd, "ETF", "KOSPI"));
        }
        if ("ETN".equals(dataType)) {
            rows.addAll(fetchEndpoint("/etn/etn_bydd_trd", basDd, "ETN", "KOSPI"));
        }
        return rows;
    }

    private boolean isAlreadyCollected(LocalDate date, String dataType) {
        return switch (dataType) {
            case "INDEX" -> hasData(date, "INDEX");
            case "STOCK" -> hasData(date, "STOCK");
            case "BOND"  -> hasData(date, "BOND");
            case "GOLD"  -> hasData(date, "GOLD");
            case "ETF"   -> hasData(date, "ETF");
            case "ETN"   -> hasData(date, "ETN");
            case "ALL"   -> hasData(date, "INDEX") && hasData(date, "STOCK") && hasData(date, "BOND") && hasData(date, "GOLD");
            default -> false;
        };
    }

    private boolean hasData(LocalDate date, String assetType) {
        return priceMapper.countByTypeAndDate(assetType, date) > 0;
    }

    private List<MarketDailyPriceVo> dedupe(List<MarketDailyPriceVo> rows) {
        Map<String, MarketDailyPriceVo> map = new LinkedHashMap<>();
        for (MarketDailyPriceVo row : rows) {
            String key = row.getTradeDate() + "|" + row.getAssetCode() + "|" + row.getAssetType();
            map.put(key, row);
        }
        return new ArrayList<>(map.values());
    }

    private List<MarketDailyPriceVo> fetchEndpoint(String path, String basDd, String assetType, String marketHint) {
        return krxApiClient.fetchRows(path, basDd).stream()
                .filter(row -> includeRow(row, assetType, marketHint))
                .map(row -> toPrice(row, assetType, marketHint, basDd))
                .filter(item -> item.getAssetCode() != null && item.getClosePrice() != null)
                .toList();
    }

    private boolean includeRow(Map<String, Object> row, String assetType, String marketHint) {
        if (!"INDEX".equals(assetType)) {
            return true;
        }
        String indexName = str(row, "IDX_NM", "");
        if ("KOSPI".equals(marketHint)) {
            return "코스피".equals(indexName) || "KOSPI".equalsIgnoreCase(indexName);
        }
        if ("KOSDAQ".equals(marketHint)) {
            return "코스닥".equals(indexName) || "KOSDAQ".equalsIgnoreCase(indexName);
        }
        return true;
    }

    private MarketDailyPriceVo toPrice(Map<String, Object> row, String assetType, String marketHint, String basDd) {
        MarketDailyPriceVo vo = new MarketDailyPriceVo();
        vo.setTradeDate(LocalDate.parse(str(row, "BAS_DD", basDd), BASIC));
        vo.setAssetType(assetType);
        vo.setAssetCode(code(row, assetType, marketHint));
        vo.setAssetName(name(row, assetType, marketHint));
        vo.setOpenPrice(num(row, "TDD_OPNPRC", "OPNPRC", "IDX_OPNPRC", "OPNPRC_IDX"));
        vo.setHighPrice(num(row, "TDD_HGPRC", "HGPRC", "IDX_HGPRC", "HGPRC_IDX"));
        vo.setLowPrice(num(row, "TDD_LWPRC", "LWPRC", "IDX_LWPRC", "LWPRC_IDX"));
        vo.setClosePrice(num(row, "TDD_CLSPRC", "CLSPRC", "IDX_CLSPRC", "CLSPRC_IDX", "BND_CLSPRC"));
        vo.setVolume(longNum(row, "ACC_TRDVOL", "TRDVOL"));
        vo.setMarketCap(longNum(row, "MKTCAP", "LIST_SHRS"));
        vo.setSector(str(row, "SECT_TP_NM", str(row, "MKT_NM", marketHint)));
        vo.setYtm(num(row, "YTM"));
        return vo;
    }

    private String code(Map<String, Object> row, String assetType, String marketHint) {
        if ("INDEX".equals(assetType)) {
            String name = name(row, assetType, marketHint).toUpperCase(Locale.ROOT);
            if (name.contains("KOSDAQ") || name.contains("코스닥")) {
                return "KOSDAQ";
            }
            return "KOSPI";
        }
        if ("BOND".equals(assetType)) {
            return "KTB3Y";
        }
        if ("GOLD".equals(assetType)) {
            return "GOLD";
        }
        return str(row, "ISU_SRT_CD", str(row, "ISU_CD", null));
    }

    private String name(Map<String, Object> row, String assetType, String marketHint) {
        if ("BOND".equals(assetType)) {
            return "국채 3년";
        }
        if ("GOLD".equals(assetType)) {
            return "금";
        }
        return str(row, "ISU_ABBRV", str(row, "ISU_NM", str(row, "IDX_NM", marketHint)));
    }

    private List<LocalDate> dateRange(LocalDate from, LocalDate to) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate cur = from;
        while (!cur.isAfter(to)) {
            dates.add(cur);
            cur = cur.plusDays(1);
        }
        return dates;
    }

    private void invalidateBacktestCache(List<LocalDate> dates) {
        if (dates.isEmpty()) {
            return;
        }
        LocalDate from = dates.get(0);
        LocalDate to = dates.get(dates.size() - 1);
        jdbcTemplate.update("DELETE FROM quant_trade_log WHERE from_date <= ? AND to_date >= ?", to, from);
        jdbcTemplate.update("DELETE FROM quant_backtest_result WHERE from_date <= ? AND to_date >= ?", to, from);
    }

    private String normalizeType(String dataType) {
        return dataType == null || dataType.isBlank() ? "ALL" : dataType.toUpperCase(Locale.ROOT);
    }

    private String str(Map<String, Object> row, String key, String fallback) {
        Object value = row.get(key);
        if (value == null) {
            return fallback;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() || "-".equals(text) ? fallback : text;
    }

    private BigDecimal num(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            Object value = row.get(key);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).replace(",", "").trim();
            if (text.isBlank() || "-".equals(text)) {
                continue;
            }
            try {
                return new BigDecimal(text);
            } catch (NumberFormatException ignored) {
                // Try the next candidate field.
            }
        }
        return null;
    }

    private Long longNum(Map<String, Object> row, String... keys) {
        BigDecimal value = num(row, keys);
        return value == null ? null : value.longValue();
    }
}
