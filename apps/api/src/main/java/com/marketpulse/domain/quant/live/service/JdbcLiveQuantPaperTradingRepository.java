package com.marketpulse.domain.quant.live.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JdbcLiveQuantPaperTradingRepository implements LiveQuantPaperTradingRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<PaperCandidate> candidateMapper = (rs, rowNum) -> new PaperCandidate(
            rs.getLong("id"),
            rs.getString("model_code"),
            rs.getDate("signal_date").toLocalDate(),
            rs.getDate("market_date").toLocalDate(),
            rs.getString("asset_code"),
            rs.getString("asset_name"),
            rs.getString("decision"),
            rs.getString("reason"),
            rs.getBigDecimal("signal_price"),
            rs.getBigDecimal("expected_return_pct"),
            rs.getString("source")
    );

    private final RowMapper<PaperPosition> positionMapper = (rs, rowNum) -> new PaperPosition(
            rs.getLong("id"),
            rs.getString("model_code"),
            rs.getString("asset_code"),
            rs.getString("asset_name"),
            rs.getTimestamp("entry_time").toInstant(),
            rs.getBigDecimal("entry_price"),
            rs.getLong("quantity"),
            rs.getString("status")
    );

    private final RowMapper<PaperTrade> tradeMapper = (rs, rowNum) -> new PaperTrade(
            rs.getLong("id"),
            rs.getString("model_code"),
            rs.getLong("position_id"),
            rs.getString("asset_code"),
            rs.getString("asset_name"),
            rs.getString("side"),
            rs.getTimestamp("fill_time").toInstant(),
            rs.getBigDecimal("signal_price"),
            rs.getBigDecimal("fill_price"),
            rs.getLong("quantity"),
            rs.getBigDecimal("realized_return_pct"),
            rs.getString("reason"),
            rs.getString("source")
    );

    @Override
    public void upsertCandidate(PaperCandidate candidate) {
        jdbcTemplate.update("""
                INSERT INTO quant_live_paper_candidate (
                    model_code, signal_date, market_date, asset_code, asset_name,
                    decision, reason, signal_price, expected_return_pct, source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (model_code, signal_date, asset_code) DO UPDATE
                    SET market_date = EXCLUDED.market_date,
                        asset_name = EXCLUDED.asset_name,
                        decision = EXCLUDED.decision,
                        reason = EXCLUDED.reason,
                        signal_price = EXCLUDED.signal_price,
                        expected_return_pct = EXCLUDED.expected_return_pct,
                        source = EXCLUDED.source,
                        updated_at = NOW()
                """,
                candidate.modelCode(),
                candidate.signalDate(),
                candidate.marketDate(),
                candidate.assetCode(),
                candidate.assetName(),
                candidate.decision(),
                candidate.reason(),
                candidate.signalPrice(),
                candidate.expectedReturnPct(),
                candidate.source()
        );
    }

    @Override
    public List<PaperCandidate> findCandidates(String modelCode, LocalDate signalDate) {
        if (signalDate == null) {
            return jdbcTemplate.query("""
                    SELECT *
                    FROM quant_live_paper_candidate
                    WHERE model_code = ?
                    ORDER BY signal_date DESC, id DESC
                    LIMIT 200
                    """, candidateMapper, modelCode);
        }
        return jdbcTemplate.query("""
                SELECT *
                FROM quant_live_paper_candidate
                WHERE model_code = ?
                  AND signal_date = ?
                ORDER BY id DESC
                """, candidateMapper, modelCode, signalDate);
    }

    @Override
    public List<PaperPosition> findOpenPositions(String modelCode) {
        if (modelCode == null || modelCode.isBlank()) {
            return jdbcTemplate.query("""
                    SELECT *
                    FROM quant_live_paper_position
                    WHERE status = 'OPEN'
                    ORDER BY entry_time DESC, id DESC
                    """, positionMapper);
        }
        return jdbcTemplate.query("""
                SELECT *
                FROM quant_live_paper_position
                WHERE model_code = ?
                  AND status = 'OPEN'
                ORDER BY entry_time DESC, id DESC
                """, positionMapper, modelCode);
    }

    @Override
    public Optional<PaperPosition> findOpenPosition(String modelCode, String assetCode) {
        List<PaperPosition> rows = jdbcTemplate.query("""
                SELECT *
                FROM quant_live_paper_position
                WHERE model_code = ?
                  AND asset_code = ?
                  AND status = 'OPEN'
                ORDER BY entry_time DESC
                LIMIT 1
                """, positionMapper, modelCode, assetCode);
        return rows.stream().findFirst();
    }

    @Override
    public void openPosition(PaperPosition position) {
        jdbcTemplate.update("""
                INSERT INTO quant_live_paper_position (
                    model_code, asset_code, asset_name, entry_time, entry_price, quantity, status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
                ON CONFLICT (model_code, asset_code) WHERE status = 'OPEN' DO NOTHING
                """,
                position.modelCode(),
                position.assetCode(),
                position.assetName(),
                Timestamp.from(position.entryTime()),
                position.entryPrice(),
                position.quantity()
        );
    }

    @Override
    public void closePosition(long positionId) {
        jdbcTemplate.update("""
                UPDATE quant_live_paper_position
                SET status = 'CLOSED',
                    updated_at = NOW()
                WHERE id = ?
                """, positionId);
    }

    @Override
    public void insertTrade(PaperTrade trade) {
        jdbcTemplate.update("""
                INSERT INTO quant_live_paper_trade (
                    model_code, position_id, asset_code, asset_name, side, fill_time,
                    signal_price, fill_price, quantity, amount, realized_return_pct, reason, source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ROUND(? * ?)::bigint, ?, ?, ?)
                """,
                trade.modelCode(),
                trade.positionId(),
                trade.assetCode(),
                trade.assetName(),
                trade.side(),
                Timestamp.from(trade.fillTime()),
                trade.signalPrice(),
                trade.fillPrice(),
                trade.quantity(),
                trade.fillPrice(),
                trade.quantity(),
                trade.realizedReturnPct(),
                trade.reason(),
                trade.source()
        );
    }

    @Override
    public List<PaperTrade> findTrades(String modelCode) {
        return jdbcTemplate.query("""
                SELECT *
                FROM quant_live_paper_trade
                WHERE model_code = ?
                ORDER BY fill_time DESC, id DESC
                LIMIT 300
                """, tradeMapper, modelCode);
    }
}
