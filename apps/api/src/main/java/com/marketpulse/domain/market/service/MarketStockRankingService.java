package com.marketpulse.domain.market.service;

import com.marketpulse.domain.market.dto.MarketStockRankingDto;
import com.marketpulse.domain.quant.mapper.MarketDailyPriceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MarketStockRankingService {
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 100;

    private final MarketDailyPriceMapper marketDailyPriceMapper;

    public List<MarketStockRankingDto> getRankings(String date, String sort, Integer limit) {
        LocalDate tradeDate = resolveDate(date);
        String rankingSort = resolveSort(sort);
        int rankingLimit = resolveLimit(limit);
        return marketDailyPriceMapper.findStockRankings(tradeDate, rankingSort, rankingLimit);
    }

    static LocalDate previousFriday(LocalDate baseDate) {
        int diff = (baseDate.getDayOfWeek().getValue() - DayOfWeek.FRIDAY.getValue() + 7) % 7;
        return baseDate.minusDays(diff);
    }

    private LocalDate resolveDate(String date) {
        if (date == null || date.isBlank()) {
            return previousFriday(LocalDate.now());
        }
        return LocalDate.parse(date, BASIC);
    }

    private String resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return "VOLUME";
        }
        String normalized = sort.trim().toUpperCase(Locale.ROOT);
        if (!"VOLUME".equals(normalized) && !"TRADE_AMOUNT".equals(normalized)) {
            throw new IllegalArgumentException("sort는 VOLUME 또는 TRADE_AMOUNT만 가능합니다.");
        }
        return normalized;
    }

    private int resolveLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }
}
