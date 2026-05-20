package com.marketpulse.domain.quant.runner;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class QuantSchemaInitRunner implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS market_daily_price (
                    id           BIGSERIAL    PRIMARY KEY,
                    trade_date   DATE         NOT NULL,
                    asset_code   VARCHAR(20)  NOT NULL,
                    asset_type   VARCHAR(10)  NOT NULL,
                    asset_name   VARCHAR(100),
                    open_price   NUMERIC(18,4),
                    high_price   NUMERIC(18,4),
                    low_price    NUMERIC(18,4),
                    close_price  NUMERIC(18,4) NOT NULL,
                    volume       BIGINT,
                    market_cap   BIGINT,
                    sector       VARCHAR(100),
                    ytm          NUMERIC(8,4),
                    created_at   TIMESTAMP    DEFAULT NOW(),
                    CONSTRAINT uq_market_daily_price UNIQUE (trade_date, asset_code, asset_type)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_mdp_date_type ON market_daily_price(trade_date, asset_type)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_mdp_code_date ON market_daily_price(asset_code, trade_date)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_mdp_type_date_code ON market_daily_price(asset_type, trade_date, asset_code)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_mdp_type_code_date ON market_daily_price(asset_type, asset_code, trade_date)");
        jdbcTemplate.execute("ALTER TABLE market_daily_price ALTER COLUMN ytm TYPE NUMERIC(18,4)");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_strategy (
                    id              BIGSERIAL    PRIMARY KEY,
                    name            VARCHAR(100) NOT NULL,
                    name_en         VARCHAR(50)  NOT NULL UNIQUE,
                    description     TEXT,
                    asset_type      VARCHAR(10)  NOT NULL,
                    rebalance_cycle VARCHAR(20)  NOT NULL,
                    params          JSONB,
                    is_active       BOOLEAN      DEFAULT TRUE,
                    created_at      TIMESTAMP    DEFAULT NOW()
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_backtest_result (
                    id              BIGSERIAL    PRIMARY KEY,
                    strategy_id     BIGINT       NOT NULL REFERENCES quant_strategy(id),
                    from_date       DATE         NOT NULL,
                    to_date         DATE         NOT NULL,
                    trade_date      DATE         NOT NULL,
                    portfolio_value BIGINT       NOT NULL,
                    return_pct      NUMERIC(10,6) NOT NULL,
                    cash            BIGINT       NOT NULL DEFAULT 0,
                    equity          BIGINT       NOT NULL DEFAULT 0,
                    created_at      TIMESTAMP    DEFAULT NOW(),
                    CONSTRAINT uq_qbr UNIQUE (strategy_id, from_date, to_date, trade_date)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qbr_strategy_date ON quant_backtest_result(strategy_id, from_date, to_date, trade_date)");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_trade_log (
                    id             BIGSERIAL    PRIMARY KEY,
                    strategy_id    BIGINT       NOT NULL REFERENCES quant_strategy(id),
                    from_date      DATE         NOT NULL,
                    to_date        DATE         NOT NULL,
                    trade_date     DATE         NOT NULL,
                    asset_code     VARCHAR(20)  NOT NULL,
                    asset_name     VARCHAR(100),
                    asset_type     VARCHAR(10)  NOT NULL,
                    trade_type     VARCHAR(10)  NOT NULL,
                    price          NUMERIC(18,4) NOT NULL,
                    quantity       BIGINT       NOT NULL,
                    amount         BIGINT       NOT NULL,
                    weight         NUMERIC(8,6),
                    reason         VARCHAR(200),
                    commission     BIGINT       DEFAULT 0,
                    tax            BIGINT       DEFAULT 0,
                    created_at     TIMESTAMP    DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qtl_strategy ON quant_trade_log(strategy_id, from_date, to_date, trade_date)");
    }
}
