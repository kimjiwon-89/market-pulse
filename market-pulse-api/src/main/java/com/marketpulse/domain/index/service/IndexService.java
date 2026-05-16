package com.marketpulse.domain.index.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketpulse.domain.index.dto.*;
import com.marketpulse.global.mock.MockDataProvider;
import com.marketpulse.domain.index.mapper.IndexMapper;
import com.marketpulse.domain.index.vo.IndexSnapshotVo;
import com.marketpulse.external.client.ExternalApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndexService {

    private final ExternalApiClient externalApiClient;
    private final IndexMapper indexMapper;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String[] MAIN_INDEX_CODES = {"0001", "1001", "2001"};
    private static final String[] SECTOR_CODES = {
            "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0011"
    };
    private static final Map<String, String> SECTOR_NAMES = Map.ofEntries(
            Map.entry("0002", "음식료"),
            Map.entry("0003", "에너지/광업"),
            Map.entry("0004", "화학"),
            Map.entry("0005", "철강금속"),
            Map.entry("0006", "기계"),
            Map.entry("0007", "전기전자"),
            Map.entry("0008", "의료정밀"),
            Map.entry("0009", "금융"),
            Map.entry("0010", "통신"),
            Map.entry("0011", "건설")
    );

    /* ── 조회: DB에서 읽기 ── */

    public IndexResponse callIndex(IndexRequest request) {
        String indexCode = request.getIndexCode() != null ? request.getIndexCode() : "0001";
        try {
            IndexSnapshotVo vo = indexMapper.findLatest(indexCode);
            if (vo == null) {
                log.warn("No index snapshot in DB for code={}, returning mock data", indexCode);
                return MockDataProvider.mockIndexResponse(indexCode);
            }
            return toIndexResponse(vo);
        } catch (Exception e) {
            log.warn("DB error in callIndex code={}, returning mock data: {}", indexCode, e.getMessage());
            return MockDataProvider.mockIndexResponse(indexCode);
        }
    }

    public List<TopSectorItem> getTopSectors() {
        List<String> codes = Arrays.asList(SECTOR_CODES);
        List<IndexSnapshotVo> snapshots;
        try {
            snapshots = indexMapper.findLatestByCodes(codes);
        } catch (Exception e) {
            log.warn("DB error in getTopSectors, returning mock data: {}", e.getMessage());
            return MockDataProvider.mockTopSectors();
        }
        if (snapshots.isEmpty()) {
            log.warn("No sector snapshots in DB, returning mock data");
            return MockDataProvider.mockTopSectors();
        }
        return snapshots.stream()
                .map(this::toTopSectorItem)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(TopSectorItem::getChangeRate).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    /* ── 수집: KIS API 호출 후 DB 저장 (스케줄러에서 호출) ── */

    public void fetchAndSaveAll() {
        for (String code : MAIN_INDEX_CODES) {
            fetchAndSave(code);
        }
        for (String code : SECTOR_CODES) {
            fetchAndSave(code);
        }
    }

    public void fetchAndSave(String indexCode) {
        try {
            String today = LocalDate.now().format(FMT);
            String monthAgo = LocalDate.now().minusDays(30).format(FMT);

            Map<String, String> params = new HashMap<>();
            params.put("fid_cond_mrkt_div_code", "U");
            params.put("fid_input_iscd", indexCode);
            params.put("fid_input_date_1", monthAgo);
            params.put("fid_input_date_2", today);
            params.put("fid_period_div_code", "D");

            IndexResponse response = externalApiClient.callGet(
                    "/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice",
                    "FHKUP03500100",
                    params,
                    new ParameterizedTypeReference<IndexResponse>() {}
            );
            response.validate();

            IndexCurrentItem current = response.getOutput1();
            if (current == null) return;

            String dailyJson = "[]";
            if (response.getOutput2() != null) {
                dailyJson = objectMapper.writeValueAsString(response.getOutput2());
            }

            IndexSnapshotVo vo = new IndexSnapshotVo();
            vo.setSnapDate(LocalDate.now());
            vo.setIndexCode(indexCode);
            vo.setIndexName(SECTOR_NAMES.getOrDefault(indexCode, current.getHts_kor_isnm()));
            vo.setCurrentPrice(current.getBstp_nmix_prpr());
            vo.setChangeAmount(current.getBstp_nmix_prdy_vrss());
            vo.setChangeRate(current.getBstp_nmix_prdy_ctrt());
            vo.setTradeVolume(current.getAcml_vol());
            vo.setTradeAmount(current.getAcml_tr_pbmn());
            vo.setDailyJson(dailyJson);
            indexMapper.upsert(vo);

            log.info("Index snapshot saved: code={}", indexCode);
        } catch (Exception e) {
            log.error("Index snapshot failed for code={}: {}", indexCode, e.getMessage());
        }
    }

    /* ── 변환 헬퍼 ── */

    private IndexResponse toIndexResponse(IndexSnapshotVo vo) {
        IndexCurrentItem current = new IndexCurrentItem();
        current.setBstp_nmix_prpr(vo.getCurrentPrice());
        current.setBstp_nmix_prdy_vrss(vo.getChangeAmount());
        current.setBstp_nmix_prdy_ctrt(vo.getChangeRate());
        current.setAcml_vol(vo.getTradeVolume());
        current.setAcml_tr_pbmn(vo.getTradeAmount());
        current.setHts_kor_isnm(vo.getIndexName());
        current.setBstp_cls_code(vo.getIndexCode());

        List<IndexDailyItem> daily = List.of();
        try {
            if (vo.getDailyJson() != null && !vo.getDailyJson().isBlank()) {
                daily = objectMapper.readValue(vo.getDailyJson(), new TypeReference<List<IndexDailyItem>>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to deserialize daily_json for code={}: {}", vo.getIndexCode(), e.getMessage());
        }

        IndexResponse resp = new IndexResponse();
        resp.setRt_cd("0");
        resp.setOutput1(current);
        resp.setOutput2(daily);
        return resp;
    }

    private TopSectorItem toTopSectorItem(IndexSnapshotVo vo) {
        try {
            double price = parseDouble(vo.getCurrentPrice());
            double changeRate = parseDouble(vo.getChangeRate());
            String volume = formatVolume(vo.getTradeAmount());

            double[] history = new double[0];
            if (vo.getDailyJson() != null && !vo.getDailyJson().isBlank()) {
                List<IndexDailyItem> daily = objectMapper.readValue(
                        vo.getDailyJson(), new TypeReference<List<IndexDailyItem>>() {});
                history = daily.stream()
                        .limit(5)
                        .mapToDouble(d -> parseDouble(d.getBstp_nmix_prpr()))
                        .toArray();
            }

            return TopSectorItem.builder()
                    .code(vo.getIndexCode())
                    .name(SECTOR_NAMES.getOrDefault(vo.getIndexCode(), vo.getIndexName()))
                    .price(price)
                    .changeRate(changeRate)
                    .volume(volume)
                    .history(history)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to build TopSectorItem for code={}: {}", vo.getIndexCode(), e.getMessage());
            return null;
        }
    }

    private String formatVolume(String tradeAmount) {
        if (tradeAmount == null || tradeAmount.isBlank()) return "0";
        try {
            return String.format("%d", Long.parseLong(tradeAmount.trim()) / 100_000_000);
        } catch (NumberFormatException e) {
            return "0";
        }
    }

    private double parseDouble(String value) {
        if (value == null || value.isBlank()) return 0.0;
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
