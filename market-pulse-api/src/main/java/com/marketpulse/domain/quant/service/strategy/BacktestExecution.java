package com.marketpulse.domain.quant.service.strategy;

import com.marketpulse.domain.quant.dto.BacktestResponseDto;
import com.marketpulse.domain.quant.vo.QuantBacktestResultVo;
import com.marketpulse.domain.quant.vo.QuantTradeLogVo;

import java.util.List;

public record BacktestExecution(
        BacktestResponseDto response,
        List<QuantBacktestResultVo> results,
        List<QuantTradeLogVo> trades
) {}
