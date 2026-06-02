package com.marketpulse.domain.quant.live.service;

import java.util.Optional;

@FunctionalInterface
public interface RealtimeStockSnapshotProvider {
    Optional<RealtimeStockSnapshot> currentSnapshot(String assetCode);
}
