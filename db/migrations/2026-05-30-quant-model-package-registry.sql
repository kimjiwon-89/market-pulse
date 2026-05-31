-- Purpose: registry for folder-driven quant model package handoff and admin exposure control.
-- Owner: quant-serving
-- Grain: one row per accepted model_code package.
-- PK: model_code.
-- Unique: model_code.
-- Indexes: public visibility lookup by public_visible and updated_at DESC.
-- Backfill: seed visible package shells with 2026-05-31-quant-four-package-visible-seed.sql.
-- Rollback: DROP INDEX idx_quant_model_package_registry_visible; DROP TABLE quant_model_package_registry;
-- Validation: SELECT model_code, model_name, public_visible, runtime_ready FROM quant_model_package_registry ORDER BY updated_at DESC;
-- Sensitivity: model package metadata only; no user data.

CREATE TABLE IF NOT EXISTS quant_model_package_registry (
    model_code                  VARCHAR(50) PRIMARY KEY,
    model_name                  VARCHAR(100) NOT NULL,
    model_version               VARCHAR(30)  NOT NULL,
    category                    VARCHAR(30)  NOT NULL DEFAULT '기타',
    description                 TEXT,
    package_path                TEXT         NOT NULL,
    package_status              VARCHAR(30)  NOT NULL DEFAULT 'DETECTED',
    public_visible              BOOLEAN      NOT NULL DEFAULT FALSE,
    runtime_ready               BOOLEAN      NOT NULL DEFAULT FALSE,
    admin_note                  TEXT,
    seed_money                  NUMERIC(18,2) NOT NULL DEFAULT 0,
    expected_monthly_return_pct NUMERIC(8,4)  NOT NULL DEFAULT 0,
    discovered_at               TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quant_model_package_registry_visible
    ON quant_model_package_registry (public_visible, updated_at DESC);
