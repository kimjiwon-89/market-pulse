package com.marketpulse.domain.quant.live.service;

import java.time.LocalDate;
import java.util.List;

public interface HistoricalReplayProvider {
    List<ReplayTradeFact> bullV4ReplayFacts(LocalDate fromDate, LocalDate toDate);
}
