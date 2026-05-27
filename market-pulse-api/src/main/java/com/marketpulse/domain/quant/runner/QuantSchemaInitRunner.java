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
                CREATE TABLE IF NOT EXISTS quant_model_definition (
                    id                  BIGSERIAL    PRIMARY KEY,
                    model_code          VARCHAR(50)  NOT NULL UNIQUE,
                    display_name        VARCHAR(120) NOT NULL,
                    description         TEXT,
                    model_type          VARCHAR(30)  NOT NULL,
                    implementation_type VARCHAR(30)  NOT NULL,
                    implementation_key  VARCHAR(80),
                    config_schema       JSONB,
                    default_config      JSONB,
                    is_user_defined     BOOLEAN      DEFAULT FALSE,
                    is_active           BOOLEAN      DEFAULT TRUE,
                    created_by          VARCHAR(50),
                    created_at          TIMESTAMP    DEFAULT NOW(),
                    updated_at          TIMESTAMP    DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qmd_active ON quant_model_definition(is_active, model_type)");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_model_version (
                    id                 BIGSERIAL   PRIMARY KEY,
                    model_code         VARCHAR(50) NOT NULL REFERENCES quant_model_definition(model_code),
                    version            VARCHAR(50) NOT NULL,
                    algorithm          VARCHAR(50) NOT NULL,
                    train_from         DATE,
                    train_to           DATE,
                    validation_summary JSONB,
                    feature_schema     JSONB,
                    label_policy       JSONB,
                    model_path         TEXT,
                    is_active          BOOLEAN     DEFAULT FALSE,
                    created_at         TIMESTAMP   DEFAULT NOW(),
                    CONSTRAINT uq_quant_model_version UNIQUE (model_code, version)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qmv_active ON quant_model_version(model_code, is_active)");
        jdbcTemplate.update("""
                INSERT INTO quant_model_definition (
                    model_code, display_name, description, model_type,
                    implementation_type, implementation_key, default_config, is_active
                )
                VALUES (
                    'BULL_V4',
                    'Bull v4 모델',
                    'Runtime Bull model managed with model SemVer.',
                    'TRADING',
                    'RULE_BASED_REPLAY',
                    'BULL_V4_5_0_0_BALANCED_PAPER',
                    '{"modelVersion":"5.0.0","configKey":"BULL_V4_5_0_0_BALANCED_PAPER","seedMoney":1000000000,"positionCash":100000000}'::jsonb,
                    true
                )
                ON CONFLICT (model_code) DO UPDATE
                    SET display_name = EXCLUDED.display_name,
                        description = EXCLUDED.description,
                        implementation_type = EXCLUDED.implementation_type,
                        implementation_key = EXCLUDED.implementation_key,
                        default_config = EXCLUDED.default_config,
                        is_active = true,
                        updated_at = NOW()
                """);
        jdbcTemplate.update("""
                UPDATE quant_model_version
                SET is_active = false
                WHERE model_code = 'BULL_V4'
                  AND version <> '5.0.0'
                """);
        jdbcTemplate.update("""
                INSERT INTO quant_model_version (
                    model_code, version, algorithm, validation_summary,
                    feature_schema, label_policy, is_active
                )
                VALUES (
                    'BULL_V4',
                    '5.0.0',
                    'RULE_BASED_REPLAY',
                    '{"runtimeConfigKey":"BULL_V4_5_0_0_BALANCED_PAPER","runtimeSource":"market_daily_price_replay"}'::jsonb,
                    '{"source":"market_daily_price","pipeline":"bull_v4_filtered_w4_range20_entry_confirmation"}'::jsonb,
                    '{"signalDate":"separated","rebalanceDate":"entry_date","executionDate":"entry_date","returnPeriod":"entry_to_exit"}'::jsonb,
                    true
                )
                ON CONFLICT (model_code, version) DO UPDATE
                    SET algorithm = EXCLUDED.algorithm,
                        validation_summary = EXCLUDED.validation_summary,
                        feature_schema = EXCLUDED.feature_schema,
                        label_policy = EXCLUDED.label_policy,
                        is_active = true
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_core_feature_snapshot (
                    id                 BIGSERIAL    PRIMARY KEY,
                    model_code         VARCHAR(50)  NOT NULL REFERENCES quant_model_definition(model_code),
                    signal_date        DATE         NOT NULL,
                    asset_code         VARCHAR(20)  NOT NULL,
                    asset_name         VARCHAR(100),
                    market             VARCHAR(10),
                    sector             VARCHAR(100),
                    features           JSONB        NOT NULL,
                    preprocessing_meta JSONB,
                    label              VARCHAR(20),
                    forward_return     NUMERIC(12,6),
                    benchmark_return   NUMERIC(12,6),
                    created_at         TIMESTAMP    DEFAULT NOW(),
                    CONSTRAINT uq_quant_core_feature UNIQUE (model_code, signal_date, asset_code)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qcfs_model_date ON quant_core_feature_snapshot(model_code, signal_date)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qcfs_asset_date ON quant_core_feature_snapshot(asset_code, signal_date)");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_candle_feature_snapshot (
                    id                    BIGSERIAL    PRIMARY KEY,
                    signal_date           DATE         NOT NULL,
                    asset_code            VARCHAR(20)  NOT NULL,
                    asset_name            VARCHAR(100),
                    asset_type            VARCHAR(10)  NOT NULL DEFAULT 'STOCK',
                    sector                VARCHAR(100),
                    open_price            NUMERIC(18,4),
                    high_price            NUMERIC(18,4),
                    low_price             NUMERIC(18,4),
                    close_price           NUMERIC(18,4) NOT NULL,
                    volume                BIGINT,
                    market_cap            BIGINT,
                    ma20                  NUMERIC(18,6),
                    ma60                  NUMERIC(18,6),
                    high20                NUMERIC(18,4),
                    high60_prior          NUMERIC(18,4),
                    low20                 NUMERIC(18,4),
                    ret20                 NUMERIC(14,8),
                    ret60                 NUMERIC(14,8),
                    drawdown20            NUMERIC(14,8),
                    drawdown60            NUMERIC(14,8),
                    candle_location       NUMERIC(14,8),
                    body_ratio            NUMERIC(14,8),
                    volume_expansion      NUMERIC(14,8),
                    trade_amount20_avg    NUMERIC(24,4),
                    range20               NUMERIC(14,8),
                    created_at            TIMESTAMP    DEFAULT NOW(),
                    CONSTRAINT uq_qcandle_feature UNIQUE (signal_date, asset_code)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qcandle_date ON quant_candle_feature_snapshot(signal_date)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qcandle_asset_date ON quant_candle_feature_snapshot(asset_code, signal_date)");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_core_signal (
                    id               BIGSERIAL    PRIMARY KEY,
                    model_code       VARCHAR(50)  NOT NULL REFERENCES quant_model_definition(model_code),
                    model_version_id BIGINT       REFERENCES quant_model_version(id),
                    signal_date      DATE         NOT NULL,
                    asset_code       VARCHAR(20)  NOT NULL,
                    asset_name       VARCHAR(100),
                    market           VARCHAR(10),
                    sector           VARCHAR(100),
                    winner_prob      NUMERIC(10,6) NOT NULL,
                    neutral_prob     NUMERIC(10,6),
                    loser_prob       NUMERIC(10,6),
                    score            NUMERIC(12,6) NOT NULL,
                    rank             INTEGER,
                    target_weight    NUMERIC(10,6),
                    reason           JSONB,
                    risk_flags       JSONB,
                    created_at       TIMESTAMP     DEFAULT NOW(),
                    CONSTRAINT uq_quant_core_signal UNIQUE (model_code, signal_date, asset_code)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qcs_model_date ON quant_core_signal(model_code, signal_date)");

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

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS quant_bull_v4_replay_fact (
                    id                 BIGSERIAL    PRIMARY KEY,
                    config_key         VARCHAR(60)  NOT NULL,
                    signal_date        DATE,
                    entry_check_date   DATE,
                    entry_date         DATE         NOT NULL,
                    exit_date          DATE         NOT NULL,
                    asset_code         VARCHAR(20)  NOT NULL,
                    asset_name         VARCHAR(100),
                    entry_price        NUMERIC(18,4) NOT NULL,
                    exit_price         NUMERIC(18,4) NOT NULL,
                    return_pct         NUMERIC(12,6) NOT NULL,
                    score              NUMERIC(18,8),
                    exit_reason        VARCHAR(60),
                    position_cash      NUMERIC(18,0) NOT NULL DEFAULT 100000000,
                    pnl_krw            NUMERIC(18,0),
                    capital_return_pct NUMERIC(12,6),
                    created_at         TIMESTAMP DEFAULT NOW(),
                    updated_at         TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT uq_qbull_v4_replay_fact UNIQUE (config_key, entry_date, asset_code, exit_date)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qbull_v4_replay_config_exit ON quant_bull_v4_replay_fact(config_key, exit_date)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_qbull_v4_replay_config_entry ON quant_bull_v4_replay_fact(config_key, entry_date)");
    }
}
