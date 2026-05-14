package com.marketpulse.domain.index.service;

import com.marketpulse.domain.index.dto.*;
import com.marketpulse.external.client.ExternalApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IndexService {

    private final ExternalApiClient externalApiClient;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // KOSPI 주요 업종 코드 (음식료, 에너지, 화학, 철강금속, 기계, 전기전자, 의료정밀, 금융, 통신, 건설)
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

    public IndexResponse callIndex(IndexRequest request) {
        String today = LocalDate.now().format(FMT);
        String monthAgo = LocalDate.now().minusDays(30).format(FMT);

        Map<String, String> params = new HashMap<>();
        params.put("fid_cond_mrkt_div_code", "U");
        params.put("fid_input_iscd", request.getIndexCode() != null ? request.getIndexCode() : "0001");
        params.put("fid_input_date_1", request.getFid_input_date_1() != null ? request.getFid_input_date_1() : monthAgo);
        params.put("fid_input_date_2", request.getFid_input_date_2() != null ? request.getFid_input_date_2() : today);
        params.put("fid_period_div_code", "D");

        IndexResponse response = externalApiClient.callGet(
                "/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice",
                "FHKUP03500100",
                params,
                new ParameterizedTypeReference<IndexResponse>() {}
        );

        response.validate();
        return response;
    }

    /* ── Top Sectors ── */

    public List<TopSectorItem> getTopSectors() {
        String today = LocalDate.now().format(FMT);
        String fiveDaysAgo = LocalDate.now().minusDays(5).format(FMT);

        return Arrays.stream(SECTOR_CODES)
                .map(code -> fetchSectorData(code, fiveDaysAgo, today))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(TopSectorItem::getChangeRate).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    private TopSectorItem fetchSectorData(String code, String dateFrom, String dateTo) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("fid_cond_mrkt_div_code", "U");
            params.put("fid_input_iscd", code);
            params.put("fid_input_date_1", dateFrom);
            params.put("fid_input_date_2", dateTo);
            params.put("fid_period_div_code", "D");

            IndexResponse response = externalApiClient.callGet(
                    "/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice",
                    "FHKUP03500100",
                    params,
                    new ParameterizedTypeReference<IndexResponse>() {}
            );

            response.validate();

            IndexCurrentItem current = response.getOutput1();
            List<IndexDailyItem> daily = response.getOutput2() != null ? response.getOutput2() : List.of();

            if (current == null) return null;

            double price = parseDouble(current.getBstp_nmix_prpr());
            double changeRate = parseDouble(current.getBstp_nmix_prdy_ctrt());
            String volume = formatVolume(current.getAcml_tr_pbmn());

            // 5일 종가
            double[] history = daily.stream()
                    .limit(5)
                    .map(d -> parseDouble(d.getBstp_nmix_prpr()))
                    .mapToDouble(Double::doubleValue)
                    .toArray();

            return TopSectorItem.builder()
                    .code(code)
                    .name(SECTOR_NAMES.getOrDefault(code, current.getHts_kor_isnm()))
                    .price(price)
                    .changeRate(changeRate)
                    .volume(volume)
                    .history(history)
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private String formatVolume(String tradeAmount) {
        if (tradeAmount == null || tradeAmount.isBlank()) return "0";
        try {
            long amount = Long.parseLong(tradeAmount.trim());
            return String.format("%d", amount / 100_000_000); // 억 단위
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
