package com.marketpulse.domain.investor.service;

import com.marketpulse.domain.investor.dto.InvestorDailyItem;
import com.marketpulse.domain.investor.dto.MarketFlowDto;
import com.marketpulse.domain.investor.dto.MemoRequestDto;
import com.marketpulse.domain.investor.dto.MemoResponseDto;
import com.marketpulse.domain.investor.dto.TradeTopItem;
import com.marketpulse.domain.investor.dto.TradeTopResponseDto;
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
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /* ── Trade Top ── */

    public List<TradeTopResponseDto> getTradeTop(
            String market,
            String investorType,
            String tradeType,
            String date
    ) {
        Map<String, String> params = new HashMap<>();
        params.put("fid_cond_mrkt_div_code", "J");
        params.put("fid_input_iscd", mapMarketIscd(market));
        params.put("fid_blng_cls_code", mapInvestorType(investorType));
        params.put("fid_trgt_cls_code", "BUY".equals(tradeType) ? "1" : "2");
        params.put("fid_trgt_exls_cls_code", "0");
        params.put("fid_input_date_1", date != null ? date : LocalDate.now().format(FMT));

        log.info("KIS investor params: {}", params);

        KisResponse<List<TradeTopItem>> response = externalApiClient.callGet(
                "/uapi/domestic-stock/v1/quotations/inquire-investor",
                "FHKST01010900",
                params,
                new ParameterizedTypeReference<KisResponse<List<TradeTopItem>>>() {}
        );

        log.info("KIS investor rt_cd={}, msg={}, output={}",
                response.getRt_cd(), response.getMsg1(),
                response.getOutput() != null ? "size=" + response.getOutput().size() : "NULL");

        response.validate();

        List<TradeTopItem> items = response.getOutput();
        if (items == null) return List.of();

        return IntStream.range(0, items.size())
                .mapToObj(i -> toDto(items.get(i), i + 1))
                .toList();
    }

    /* ── Market Flow (FHKST01010800) ── */

    public List<MarketFlowDto> getMarketFlow(String market) {
        Map<String, String> params = new HashMap<>();
        params.put("FID_COND_MRKT_DIV_CODE", "J");
        params.put("FID_INPUT_ISCD", "KOSDAQ".equals(market) ? "1001" : "0001");

        KisResponse<List<InvestorDailyItem>> response = externalApiClient.callGet(
                "/uapi/domestic-stock/v1/quotations/inquire-investor",
                "FHKST01010800",
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

    private TradeTopResponseDto toDto(TradeTopItem item, int rank) {
        return TradeTopResponseDto.builder()
                .rank(rank)
                .stockCode(item.getStockCode())
                .stockName(item.getStockName())
                .netBuyAmount(parseLong(item.getNetBuyAmount()))
                .netBuyVolume(parseLong(item.getNetBuyVolume()))
                .currentPrice(parseLong(item.getCurrentPrice()))
                .changeRate(parseDouble(item.getChangeRate()))
                .build();
    }

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

    private String mapInvestorType(String investorType) {
        if ("INSTITUTION".equals(investorType)) return "2";
        return "1"; // FOREIGN default
    }

    private String mapMarketIscd(String market) {
        if ("KOSDAQ".equals(market)) return "1001";
        if ("ALL".equals(market)) return "0000";
        return "0001"; // KOSPI default
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
