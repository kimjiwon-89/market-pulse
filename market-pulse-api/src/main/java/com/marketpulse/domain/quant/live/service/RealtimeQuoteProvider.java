package com.marketpulse.domain.quant.live.service;

import java.math.BigDecimal;
import java.util.Optional;

public interface RealtimeQuoteProvider {
    Optional<BigDecimal> currentPrice(String assetCode);
}
