package com.marketpulse.domain.investor.service;

import com.marketpulse.domain.investor.dto.InvestorDailyItem;
import com.marketpulse.domain.investor.dto.MarketFlowDto;
import com.marketpulse.domain.investor.dto.MemoRequestDto;
import com.marketpulse.domain.investor.dto.MemoResponseDto;
import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
import com.marketpulse.domain.investor.mapper.RankingSnapshotMapper;
import com.marketpulse.domain.investor.vo.RankingSnapshotVo;
import com.marketpulse.domain.stock.dto.ForeignTradeItem;
import com.marketpulse.global.response.KisResponse;
import com.marketpulse.domain.investor.mapper.MemoMapper;
import com.marketpulse.domain.investor.vo.MemoVo;
import com.marketpulse.external.client.ExternalApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvestorService {

    private final ExternalApiClient externalApiClient;
    private final MemoMapper memoMapper;
    private final RankingSnapshotMapper snapshotMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String[] TRADE_TYPES = {"BUY", "SELL"};
    private static final String[] MARKETS = {"KOSPI", "KOSDAQ", "ALL"};

    /* ── Trade Top ── */

    public List<TradeTopResponseDto> getTradeTop(
            String market,
            String investorType,
            String tradeType,
            String date
    ) {
        if ("INSTITUTION".equals(investorType)) {
            return List.of();
        }

        String effectiveInvestor = "FOREIGN";
        String effectiveTrade = tradeType != null ? tradeType : "BUY";
        String effectiveMarket = market != null ? market : "KOSPI";

        LocalDate today = LocalDate.now();
        LocalDate requestDate = date != null ? LocalDate.parse(date, FMT) : today;

        if (!requestDate.equals(today)) {
            // 과거 날짜 → DB 조회
            List<RankingSnapshotVo> snapshots = snapshotMapper.findByFilter(
                    requestDate, effectiveInvestor, effectiveTrade, effectiveMarket);
            return snapshots.stream()
                    .map(v -> TradeTopResponseDto.builder()
                            .rank(v.getRank())
                            .stockCode(v.getStockCode())
                            .stockName(v.getStockName())
                            .netBuyAmount(v.getNetBuyAmount())
                            .netBuyVolume(v.getNetBuyVolume())
                            .build())
                    .toList();
        }

        // 오늘 → 실시간 API
        return fetchForeignTradeTop(effectiveMarket, effectiveTrade);
    }

    /* ── Snapshot 저장 (스케줄러에서 호출) ── */

    public void saveSnapshots(LocalDate date) {
        for (String tt : TRADE_TYPES) {
            for (String mkt : MARKETS) {
                try {
                    List<TradeTopResponseDto> items = fetchForeignTradeTop(mkt, tt);
                    if (items.isEmpty()) {
                        log.warn("Snapshot empty for FOREIGN/{}/{} on {}", tt, mkt, date);
                        continue;
                    }
                    List<RankingSnapshotVo> vos = items.stream().map(dto -> {
                        RankingSnapshotVo vo = new RankingSnapshotVo();
                        vo.setSnapDate(date);
                        vo.setInvestorType("FOREIGN");
                        vo.setTradeType(tt);
                        vo.setMarket(mkt);
                        vo.setRank(dto.getRank());
                        vo.setStockCode(dto.getStockCode());
                        vo.setStockName(dto.getStockName());
                        vo.setNetBuyAmount(dto.getNetBuyAmount());
                        vo.setNetBuyVolume(dto.getNetBuyVolume());
                        return vo;
                    }).toList();
                    snapshotMapper.bulkUpsert(vos);
                    log.info("Snapshot saved: {} rows for FOREIGN/{}/{} on {}", vos.size(), tt, mkt, date);
                } catch (Exception e) {
                    log.error("Snapshot failed for FOREIGN/{}/{}: {}", tt, mkt, e.getMessage());
                }
            }
        }
    }

    private List<TradeTopResponseDto> fetchForeignTradeTop(String market, String tradeType) {
        Map<String, String> params = new HashMap<>();
        params.put("FID_COND_MRKT_DIV_CODE", "J");
        params.put("FID_COND_SCR_DIV_CODE", "16441");
        params.put("FID_INPUT_ISCD", mapMarketIscdForeign(market));
        params.put("FID_RANK_SORT_CLS_CODE", "0");
        params.put("FID_RANK_SORT_CLS_CODE_2", "BUY".equals(tradeType) ? "0" : "1");

        log.info("frgnmem-trade-estimate params: {}", params);

        KisResponse<List<ForeignTradeItem>> response = externalApiClient.callGet(
                "/uapi/domestic-stock/v1/quotations/frgnmem-trade-estimate",
                "FHKST644100C0",
                params,
                new ParameterizedTypeReference<KisResponse<List<ForeignTradeItem>>>() {}
        );

        log.info("frgnmem result: rt_cd={}, output={}",
                response.getRt_cd(),
                response.getOutput() != null ? "size=" + response.getOutput().size() : "NULL");

        response.validate();

        List<ForeignTradeItem> items = response.getOutput();
        if (items == null) return List.of();

        return IntStream.range(0, items.size())
                .mapToObj(i -> fromForeignItem(items.get(i), i + 1))
                .toList();
    }

    private TradeTopResponseDto fromForeignItem(ForeignTradeItem item, int rank) {
        return TradeTopResponseDto.builder()
                .rank(rank)
                .stockCode(item.getStockCode())
                .stockName(item.getStockName())
                .netBuyAmount(parseLong(item.getNetBuyAmount()))
                .netBuyVolume(parseLong(item.getNetVolume()))
                .currentPrice(parseLong(item.getCurrentPrice()))
                .changeRate(parseDouble(item.getChangeRate()))
                .foreignShareRatio(parseDouble(item.getForeignShareRatio()))
                .build();
    }

    private String mapMarketIscdForeign(String market) {
        if ("KOSDAQ".equals(market)) return "1001";
        if ("ALL".equals(market)) return "0000";
        return "2001"; // KOSPI
    }

    /* ── Available Snapshot Dates ── */

    public List<String> getAvailableDates(String investorType, String tradeType, String market) {
        String effectiveInvestor = investorType != null ? investorType : "FOREIGN";
        String effectiveTrade = tradeType != null ? tradeType : "BUY";
        String effectiveMarket = market != null ? market : "KOSPI";
        return snapshotMapper.findAvailableDates(effectiveInvestor, effectiveTrade, effectiveMarket);
    }

    /* ── Market Flow (FHKST01010900) ── */

    public List<MarketFlowDto> getMarketFlow(String market) {
        Map<String, String> params = new HashMap<>();
        params.put("fid_cond_mrkt_div_code", "J");
        params.put("fid_input_iscd", "KOSDAQ".equals(market) ? "1001" : "0001");

        KisResponse<List<InvestorDailyItem>> response = externalApiClient.callGet(
                "/uapi/domestic-stock/v1/quotations/inquire-investor",
                "FHKST01010900",
                params,
                new ParameterizedTypeReference<KisResponse<List<InvestorDailyItem>>>() {}
        );

        response.validate();

        List<InvestorDailyItem> items = response.getOutput();
        if (items == null || items.isEmpty()) return List.of();

        InvestorDailyItem latest = items.get(0);

        return List.of(
                MarketFlowDto.builder().name("외국인")
                        .net(parseLong(latest.getForeignNetBuyAmount()))
                        .buy(parseLong(latest.getForeignBuyAmount()))
                        .sell(parseLong(latest.getForeignSellAmount()))
                        .build(),
                MarketFlowDto.builder().name("기관")
                        .net(parseLong(latest.getInstitutionNetBuyAmount()))
                        .buy(parseLong(latest.getInstitutionBuyAmount()))
                        .sell(parseLong(latest.getInstitutionSellAmount()))
                        .build(),
                MarketFlowDto.builder().name("개인")
                        .net(parseLong(latest.getPersonalNetBuyAmount()))
                        .buy(parseLong(latest.getPersonalBuyAmount()))
                        .sell(parseLong(latest.getPersonalSellAmount()))
                        .build()
        );
    }

    /* ── Memo ── */

    public MemoResponseDto getMemo(String date, String market) {
        LocalDate memoDate = LocalDate.parse(date, FMT);
        MemoVo vo = memoMapper.findByDateAndMarket(memoDate, market);
        return vo != null ? toMemoDto(vo) : null;
    }

    public MemoResponseDto saveMemo(MemoRequestDto req) {
        LocalDate memoDate = LocalDate.parse(req.getDate(), FMT);
        MemoVo vo = new MemoVo();
        vo.setMemoDate(memoDate);
        vo.setMarket(req.getMarket());
        vo.setContent(req.getContent());
        memoMapper.upsert(vo);
        MemoVo saved = memoMapper.findByDateAndMarket(memoDate, req.getMarket());
        return toMemoDto(saved);
    }

    public void deleteMemo(Long id) {
        memoMapper.deleteById(id);
    }

    public List<MemoResponseDto> getMemoList(String market, int page, int size) {
        int offset = page * size;
        return memoMapper.findList(market, size, offset)
                .stream().map(this::toMemoDto).toList();
    }

    /* ── helpers ── */

    private MemoResponseDto toMemoDto(MemoVo vo) {
        return MemoResponseDto.builder()
                .id(vo.getId())
                .memoDate(vo.getMemoDate())
                .market(vo.getMarket())
                .content(vo.getContent())
                .createdAt(vo.getCreatedAt())
                .updatedAt(vo.getUpdatedAt())
                .build();
    }

    private long parseLong(String value) {
        if (value == null || value.isBlank()) return 0L;
        try { return Long.parseLong(value.trim()); } catch (NumberFormatException e) { return 0L; }
    }

    private double parseDouble(String value) {
        if (value == null || value.isBlank()) return 0.0;
        try { return Double.parseDouble(value.trim()); } catch (NumberFormatException e) { return 0.0; }
    }
}
