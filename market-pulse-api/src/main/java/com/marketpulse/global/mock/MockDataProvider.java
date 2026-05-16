package com.marketpulse.global.mock;

import com.marketpulse.domain.index.dto.*;
import com.marketpulse.domain.investor.dto.MarketFlowDto;
import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.news.dto.NewsRespDto;
import com.marketpulse.domain.stock.dto.StockChartItemDto;
import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.dto.StockInvestorDto;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** 장 마감·DB 미적재 환경에서 UI 미리보기용 샘플 데이터 */
public final class MockDataProvider {

    private MockDataProvider() {}

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // ── 지수 ──────────────────────────────────────────────────────────────

    private static final Map<String, double[]> INDEX_DATA = Map.of(
            "0001", new double[]{2751.05, 12.45, 0.45, 734_832_000_000L, 8_124_560_000_000L},
            "1001", new double[]{862.18, -3.24, -0.37, 1_234_560_000L, 5_432_100_000_000L},
            "2001", new double[]{371.88, 1.92, 0.52, 402_340_000_000L, 3_210_000_000_000L},
            "0002", new double[]{2134.56, 8.23, 0.39, 123_400_000_000L, 876_500_000_000L},
            "0003", new double[]{498.23, -2.14, -0.43, 98_700_000_000L, 432_100_000_000L},
            "0004", new double[]{512.34, -2.31, -0.45, 201_200_000_000L, 1_234_500_000_000L},
            "0005", new double[]{298.56, 2.65, 0.89, 156_300_000_000L, 654_320_000_000L},
            "0006", new double[]{234.12, 1.02, 0.44, 87_600_000_000L, 345_670_000_000L},
            "0007", new double[]{945.23, 16.93, 1.82, 3_456_700_000_000L, 15_678_000_000_000L},
            "0009", new double[]{734.12, 1.69, 0.23, 876_500_000_000L, 4_321_000_000_000L}
    );

    private static final Map<String, String> INDEX_NAMES = Map.of(
            "0001", "코스피", "1001", "코스닥", "2001", "코스피200",
            "0002", "음식료", "0003", "에너지/광업", "0004", "화학",
            "0005", "철강금속", "0006", "기계", "0007", "전기전자", "0009", "금융"
    );

    public static IndexResponse mockIndexResponse(String code) {
        double[] d = INDEX_DATA.getOrDefault(code, new double[]{1000.0, 5.0, 0.5, 100_000_000_000L, 500_000_000_000L});
        String name = INDEX_NAMES.getOrDefault(code, code);

        IndexCurrentItem item = new IndexCurrentItem();
        item.setBstp_nmix_prpr(String.valueOf(d[0]));
        item.setBstp_nmix_prdy_vrss(String.valueOf(d[1]));
        item.setBstp_nmix_prdy_ctrt(String.valueOf(d[2]));
        item.setAcml_vol(String.valueOf((long) d[3]));
        item.setAcml_tr_pbmn(String.valueOf((long) d[4]));
        item.setHts_kor_isnm(name);
        item.setBstp_cls_code(code);

        List<IndexDailyItem> daily = generateMockDailyIndex(d[0], 30);

        IndexResponse resp = new IndexResponse();
        resp.setRt_cd("0");
        resp.setOutput1(item);
        resp.setOutput2(daily);
        return resp;
    }

    private static List<IndexDailyItem> generateMockDailyIndex(double base, int days) {
        List<IndexDailyItem> list = new ArrayList<>();
        double price = base * 0.92;
        double[] deltas = {0.3, -0.2, 0.5, 0.1, -0.3, 0.4, 0.2, -0.1, 0.6, -0.4,
                0.3, 0.1, -0.2, 0.5, 0.2, -0.3, 0.4, 0.1, 0.3, -0.2,
                0.5, 0.2, -0.1, 0.4, 0.1, -0.2, 0.3, 0.5, -0.1, 0.2};
        LocalDate date = LocalDate.now().minusDays(days);
        for (int i = 0; i < days; i++) {
            price = price * (1 + deltas[i % deltas.length] / 100.0);
            IndexDailyItem d = new IndexDailyItem();
            d.setBstp_nmix_prpr(String.format("%.2f", price));
            d.setStck_bsop_date(date.plusDays(i).format(FMT));
            list.add(d);
        }
        return list;
    }

    public static List<TopSectorItem> mockTopSectors() {
        String[] codes = {"0007", "0005", "0009", "0004", "0006", "0002"};
        List<TopSectorItem> result = new ArrayList<>();
        for (String code : codes) {
            double[] d = INDEX_DATA.getOrDefault(code, new double[]{500.0, 1.0, 0.2, 100_000_000_000L, 500_000_000_000L});
            result.add(TopSectorItem.builder()
                    .code(code)
                    .name(INDEX_NAMES.getOrDefault(code, code))
                    .price(d[0])
                    .changeRate(d[2])
                    .volume(String.format("%d", (long) d[4] / 100_000_000))
                    .history(generateHistory(d[0], 5))
                    .build());
        }
        return result;
    }

    private static double[] generateHistory(double base, int n) {
        double[] h = new double[n];
        double p = base * 0.97;
        double[] deltas = {-0.3, 0.5, 0.2, -0.1, 0.4};
        for (int i = 0; i < n; i++) {
            p = p * (1 + deltas[i % deltas.length] / 100.0);
            h[i] = p;
        }
        return h;
    }

    // ── 투자자 순매수 ────────────────────────────────────────────────────

    private static final Object[][] TRADE_TOP_DATA = {
            {"005930", "삼성전자",  823_400_000_000L, 45_234_123L},
            {"000660", "SK하이닉스", 345_600_000_000L,  5_234_567L},
            {"005380", "현대차",    212_300_000_000L,  3_456_789L},
            {"373220", "LG에너지솔루션", 187_600_000_000L,   678_901L},
            {"005490", "POSCO홀딩스",  123_400_000_000L, 1_234_567L},
            {"035420", "NAVER",      98_700_000_000L, 2_345_678L},
            {"051910", "LG화학",     87_600_000_000L, 1_876_543L},
            {"006400", "삼성SDI",    76_500_000_000L,   654_321L},
            {"035720", "카카오",     65_400_000_000L, 4_567_890L},
            {"055550", "신한지주",   54_300_000_000L, 2_876_543L},
    };

    public static List<TradeTopResponseDto> mockTradeTop(String market, String tradeType) {
        List<TradeTopResponseDto> list = new ArrayList<>();
        boolean isSell = "SELL".equals(tradeType);
        for (int i = 0; i < TRADE_TOP_DATA.length; i++) {
            Object[] row = TRADE_TOP_DATA[i];
            long net = isSell ? -((Long) row[2]) : (Long) row[2];
            list.add(TradeTopResponseDto.builder()
                    .rank(i + 1)
                    .stockCode((String) row[0])
                    .stockName((String) row[1])
                    .netBuyAmount(net)
                    .netBuyVolume((Long) row[3])
                    .build());
        }
        return list;
    }

    public static List<MarketFlowDto> mockMarketFlow() {
        return List.of(
                MarketFlowDto.builder().name("외국인")
                        .net( 344_400_000_000L)
                        .buy(1_234_500_000_000L)
                        .sell( 890_100_000_000L).build(),
                MarketFlowDto.builder().name("기관")
                        .net( 122_200_000_000L)
                        .buy( 987_600_000_000L)
                        .sell( 865_400_000_000L).build(),
                MarketFlowDto.builder().name("개인")
                        .net(-461_100_000_000L)
                        .buy(1_523_400_000_000L)
                        .sell(1_984_500_000_000L).build()
        );
    }

    // ── 뉴스 ────────────────────────────────────────────────────────────

    public static List<NewsRespDto> mockNews() {
        String today = LocalDate.now().format(FMT);
        String[][] items = {
                {"외국인, 코스피서 삼성전자·SK하이닉스 순매수 집중", "연합뉴스", "09:30:00"},
                {"코스피 2750선 강보합 마감…반도체·자동차 주도", "한국경제", "15:45:00"},
                {"FOMC 의사록 공개…시장 반응 촉각", "매일경제", "21:00:00"},
                {"LG에너지솔루션, 북미 배터리 공장 증설 발표", "조선비즈", "11:20:00"},
                {"기관 투자자, 코스닥 바이오 종목 집중 매수", "이데일리", "14:05:00"},
        };
        List<NewsRespDto> list = new ArrayList<>();
        for (int i = 0; i < items.length; i++) {
            NewsRespDto dto = new NewsRespDto();
            dto.setCntt_usiq_srno(String.valueOf(9990000 + i));
            dto.setHts_pbnt_titl_cntt(items[i][0]);
            dto.setDorg(items[i][1]);
            dto.setData_dt(today);
            dto.setData_tm(items[i][2]);
            list.add(dto);
        }
        return list;
    }

    // ── 종목 상세 ────────────────────────────────────────────────────────

    private static final Map<String, Object[]> STOCK_DATA = Map.of(
            "005930", new Object[]{"삼성전자", 75_400L, 1_200L, "2", 1.62, 15_234_567L, 1_148_067_000_000L, 4_501_800L, 74_200L, 76_100L, 73_800L, 15.43, 1.12, 88_800L, 62_400L},
            "000660", new Object[]{"SK하이닉스", 198_500L, 3_500L, "2", 1.79, 5_678_901L, 1_127_413_000_000L, 1_443_000L, 196_000L, 201_000L, 194_500L, 23.45, 2.34, 238_500L, 148_000L},
            "005380", new Object[]{"현대차", 235_000L, -1_500L, "5", -0.63, 4_321_098L, 1_015_458_000_000L, 497_000L, 236_500L, 238_000L, 232_500L, 5.43, 0.56, 276_000L, 186_000L}
    );

    public static StockDetailDto mockDetail(String code) {
        Object[] d = STOCK_DATA.getOrDefault(code,
                new Object[]{"(샘플 종목)", 50_000L, 500L, "2", 1.01, 1_234_567L, 61_728_350_000L, 300_000L, 49_500L, 50_800L, 49_200L, 12.34, 1.05, 58_000L, 38_000L});
        return StockDetailDto.builder()
                .code(code)
                .name((String) d[0])
                .currentPrice((Long) d[1])
                .prdyVrss((Long) d[2])
                .prdyVrssSign((String) d[3])
                .changeRate((Double) d[4])
                .volume((Long) d[5])
                .tradingValue((Long) d[6])
                .marketCap((Long) d[7])
                .openPrice((Long) d[8])
                .highPrice((Long) d[9])
                .lowPrice((Long) d[10])
                .per((Double) d[11])
                .pbr((Double) d[12])
                .weekHigh((Long) d[13])
                .weekLow((Long) d[14])
                .build();
    }

    public static List<StockChartItemDto> mockChart(String code, String period) {
        int days = switch (period != null ? period : "3M") {
            case "1M" -> 22;
            case "1Y" -> 252;
            default   -> 66;
        };
        Object[] d = STOCK_DATA.getOrDefault(code,
                new Object[]{"", 50_000L, 0L, "2", 1.0, 0L, 0L, 0L, 0L, 0L, 0L, 0.0, 0.0, 0L, 0L});
        long base = (Long) d[1];

        List<StockChartItemDto> list = new ArrayList<>();
        double price = base * 0.88;
        double[] trend = {0.4, -0.2, 0.6, 0.1, -0.3, 0.5, 0.2, -0.4, 0.7, -0.1,
                0.3, 0.2, -0.2, 0.5, 0.1, -0.1, 0.4, 0.3, -0.3, 0.6,
                0.2, -0.1, 0.3, 0.4, -0.2, 0.5, 0.1, -0.3, 0.6, 0.2};

        LocalDate date = LocalDate.now().minusDays(days + days / 3);
        int added = 0;
        for (int i = 0; added < days; i++) {
            LocalDate d2 = date.plusDays(i);
            if (d2.getDayOfWeek().getValue() >= 6) continue;
            price = price * (1 + trend[i % trend.length] / 100.0);
            long close = Math.round(price);
            long high  = Math.round(price * 1.008);
            long low   = Math.round(price * 0.992);
            long open  = Math.round(price * 0.996);
            list.add(StockChartItemDto.builder()
                    .date(d2.format(FMT))
                    .close(close).open(open).high(high).low(low)
                    .volume(1_000_000L + (long)(Math.abs(trend[i % trend.length]) * 2_000_000))
                    .changeRate(trend[i % trend.length])
                    .build());
            added++;
        }
        return list;
    }

    public static StockInvestorDto mockInvestor() {
        return StockInvestorDto.builder()
                .foreignBuy( 234_500_000_000L).foreignSell( 156_700_000_000L).foreignNet( 77_800_000_000L)
                .institutionBuy(123_400_000_000L).institutionSell( 98_700_000_000L).institutionNet(24_700_000_000L)
                .individualBuy(345_600_000_000L).individualSell(447_900_000_000L).individualNet(-102_300_000_000L)
                .build();
    }
}
