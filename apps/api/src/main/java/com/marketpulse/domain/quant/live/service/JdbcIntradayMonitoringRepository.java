package com.marketpulse.domain.quant.live.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JdbcIntradayMonitoringRepository implements IntradayMonitoringRepository {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void record(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            RealtimeStockSnapshot snapshot,
            LocalDate signalDate,
            Instant observedAt
    ) {
        Timestamp timestamp = Timestamp.from(observedAt);
        String previousState = previousState(candidate.modelCode(), signalDate, candidate.assetCode()).orElse(null);
        upsertBar(candidate, snapshot, timestamp);
        upsertSnapshot(candidate, snapshot, signalDate, timestamp);
        if (previousState == null || !previousState.equals(candidate.decision())) {
            insertEvent(candidate, previousState, signalDate, timestamp);
        }
    }

    private Optional<String> previousState(String modelCode, LocalDate signalDate, String assetCode) {
        return jdbcTemplate.query("""
                        SELECT state
                        FROM quant_intraday_candidate_snapshot
                        WHERE model_code = ?
                          AND signal_date = ?
                          AND asset_code = ?
                        """,
                rs -> rs.next() ? Optional.ofNullable(rs.getString("state")) : Optional.empty(),
                modelCode,
                signalDate,
                assetCode
        );
    }

    private void upsertBar(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            RealtimeStockSnapshot snapshot,
            Timestamp timestamp
    ) {
        jdbcTemplate.update("""
                        INSERT INTO quant_intraday_bar (
                            asset_code, asset_name, market, bar_time, open_price, high_price,
                            low_price, close_price, volume, trade_amount, change_rate, source
                        )
                        VALUES (?, ?, ?, date_trunc('minute', ?::timestamp), ?, ?, ?, ?, 0, ?, ?, ?)
                        ON CONFLICT (asset_code, bar_time) DO UPDATE
                            SET asset_name = EXCLUDED.asset_name,
                                market = EXCLUDED.market,
                                high_price = GREATEST(quant_intraday_bar.high_price, EXCLUDED.close_price),
                                low_price = LEAST(quant_intraday_bar.low_price, EXCLUDED.close_price),
                                close_price = EXCLUDED.close_price,
                                trade_amount = EXCLUDED.trade_amount,
                                change_rate = EXCLUDED.change_rate,
                                source = EXCLUDED.source
                        """,
                candidate.assetCode(),
                candidate.assetName(),
                snapshot != null ? snapshot.market() : null,
                timestamp,
                candidate.signalPrice(),
                candidate.signalPrice(),
                candidate.signalPrice(),
                candidate.signalPrice(),
                snapshot != null ? snapshot.tradingValue() : 0L,
                candidate.expectedReturnPct(),
                candidate.source()
        );
    }

    private void upsertSnapshot(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            RealtimeStockSnapshot snapshot,
            LocalDate signalDate,
            Timestamp timestamp
    ) {
        jdbcTemplate.update("""
                        INSERT INTO quant_intraday_candidate_snapshot (
                            model_code, signal_date, asset_code, asset_name, market, state,
                            reason, current_price, change_rate, trade_amount, source, observed_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (model_code, signal_date, asset_code) DO UPDATE
                            SET asset_name = EXCLUDED.asset_name,
                                market = EXCLUDED.market,
                                state = EXCLUDED.state,
                                reason = EXCLUDED.reason,
                                current_price = EXCLUDED.current_price,
                                change_rate = EXCLUDED.change_rate,
                                trade_amount = EXCLUDED.trade_amount,
                                source = EXCLUDED.source,
                                observed_at = EXCLUDED.observed_at,
                                updated_at = NOW()
                        """,
                candidate.modelCode(),
                signalDate,
                candidate.assetCode(),
                candidate.assetName(),
                snapshot != null ? snapshot.market() : null,
                candidate.decision(),
                candidate.reason(),
                candidate.signalPrice(),
                candidate.expectedReturnPct(),
                snapshot != null ? snapshot.tradingValue() : 0L,
                candidate.source(),
                timestamp
        );
    }

    private void insertEvent(
            LiveQuantPaperTradingRepository.PaperCandidate candidate,
            String previousState,
            LocalDate signalDate,
            Timestamp timestamp
    ) {
        jdbcTemplate.update("""
                        INSERT INTO quant_intraday_signal_event (
                            model_code, signal_date, asset_code, asset_name, event_type,
                            from_state, to_state, reason, observed_price, change_rate, source, observed_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                candidate.modelCode(),
                signalDate,
                candidate.assetCode(),
                candidate.assetName(),
                previousState == null ? "STATE_CREATED" : "STATE_CHANGED",
                previousState,
                candidate.decision(),
                candidate.reason(),
                candidate.signalPrice(),
                candidate.expectedReturnPct(),
                candidate.source(),
                timestamp
        );
    }
}
