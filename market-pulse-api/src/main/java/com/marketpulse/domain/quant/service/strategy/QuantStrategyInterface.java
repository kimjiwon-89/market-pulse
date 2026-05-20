package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.vo.QuantStrategyVo;

import java.time.LocalDate;

public interface QuantStrategyInterface {
    String getNameEn();
    BacktestExecution run(QuantStrategyVo strategy, LocalDate fromDate, LocalDate toDate, long initialCash);
}
