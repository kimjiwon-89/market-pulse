package com.marketpulse.domain.quant.live.service;

import com.marketpulse.domain.stock.dto.StockDetailDto;
import com.marketpulse.domain.stock.service.StockDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class StockRealtimeQuoteProvider implements RealtimeQuoteProvider, RealtimeStockSnapshotProvider {
    private final StockDetailService stockDetailService;

    @Override
    public Optional<BigDecimal> currentPrice(String assetCode) {
        StockDetailDto detail = stockDetailService.getDetail(assetCode);
        if (detail == null || detail.getCurrentPrice() <= 0) {
            return Optional.empty();
        }
        return Optional.of(BigDecimal.valueOf(detail.getCurrentPrice()));
    }

    @Override
    public Optional<RealtimeStockSnapshot> currentSnapshot(String assetCode) {
        StockDetailDto detail = stockDetailService.getDetail(assetCode);
        if (detail == null || detail.getCurrentPrice() <= 0) {
            return Optional.empty();
        }
        return Optional.of(new RealtimeStockSnapshot(
                assetCode,
                detail.getName(),
                detail.getMarket(),
                BigDecimal.valueOf(detail.getCurrentPrice()),
                BigDecimal.valueOf(detail.getChangeRate()),
                detail.getTradingValue()
        ));
    }
}
