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
    ytm          NUMERIC(18,4),
    created_at   TIMESTAMP    DEFAULT NOW(),
    CONSTRAINT uq_market_daily_price UNIQUE (trade_date, asset_code, asset_type)
);

CREATE INDEX IF NOT EXISTS idx_mdp_date_type ON market_daily_price(trade_date, asset_type);
CREATE INDEX IF NOT EXISTS idx_mdp_code_date ON market_daily_price(asset_code, trade_date);
CREATE INDEX IF NOT EXISTS idx_mdp_type_date_code ON market_daily_price(asset_type, trade_date, asset_code);
CREATE INDEX IF NOT EXISTS idx_mdp_type_code_date ON market_daily_price(asset_type, asset_code, trade_date);

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
);

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
);

CREATE INDEX IF NOT EXISTS idx_qbr_strategy_date ON quant_backtest_result(strategy_id, from_date, to_date, trade_date);

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
);

CREATE INDEX IF NOT EXISTS idx_qtl_strategy ON quant_trade_log(strategy_id, from_date, to_date, trade_date);
