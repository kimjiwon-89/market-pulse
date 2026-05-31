-- Seed four lab handoff packages as visible package shells.
-- This does not mark any runtime as ready and does not approve live orders.
-- Purpose: expose four accepted quant handoff packages in the production model registry.
-- Owner: quant-serving
-- Grain: one upserted registry row per model_code.
-- PK/FK: depends on quant_model_package_registry.model_code primary key; no new table.
-- Unique: model_code via registry primary key.
-- Indexes: no new index; uses idx_quant_model_package_registry_visible.
-- Rollback: UPDATE quant_model_package_registry SET public_visible = FALSE, runtime_ready = FALSE WHERE model_code IN ('KOSPI_BULL', 'KOSDAQ_BULL', 'KOSPI_WATCH', 'KOSDAQ_WATCH');
-- Validation: SELECT model_code, model_name, seed_money, public_visible, runtime_ready FROM quant_model_package_registry WHERE model_code IN ('KOSPI_BULL', 'KOSDAQ_BULL', 'KOSPI_WATCH', 'KOSDAQ_WATCH');
-- Sensitivity: model package metadata only; no user data.

INSERT INTO quant_model_package_registry (
    model_code, model_name, model_version, category, description, package_path,
    package_status, public_visible, runtime_ready, admin_note,
    seed_money, expected_monthly_return_pct
) VALUES
(
    'KOSPI_BULL',
    'KOSPI Bull v1',
    '1.0.0',
    '상승장',
    'KOSPI 전용 상승장 paper-shadow 후보 패키지입니다.',
    'domains/quant-serving/packages/KOSPI_BULL',
    'APPROVED',
    TRUE,
    FALSE,
    '2026-05-31 lab handoff: visible package shell only; runtime/live orders disabled.',
    100000000,
    0.0
),
(
    'KOSDAQ_BULL',
    'KOSDAQ Bull v1',
    '1.0.0',
    '상승장',
    'KOSDAQ 전용 상승장 paper-runtime 후보 패키지입니다.',
    'domains/quant-serving/packages/KOSDAQ_BULL',
    'APPROVED',
    TRUE,
    FALSE,
    '2026-05-31 lab handoff: visible package shell only; runtime/live orders disabled.',
    100000000,
    4.78
),
(
    'KOSPI_WATCH',
    'KOSPI Watch',
    '0.1.0',
    '기타',
    'KOSPI 실시간 regime/watch paper-shadow 모니터 패키지입니다.',
    'domains/quant-serving/packages/KOSPI_WATCH',
    'APPROVED',
    TRUE,
    FALSE,
    '2026-05-31 lab handoff: visible package shell only; monitor does not trade.',
    100000000,
    0.0
),
(
    'KOSDAQ_WATCH',
    'KOSDAQ Watch',
    '0.1.0',
    '기타',
    'KOSDAQ 실시간 regime/watch paper-shadow 모니터 패키지입니다.',
    'domains/quant-serving/packages/KOSDAQ_WATCH',
    'APPROVED',
    TRUE,
    FALSE,
    '2026-05-31 lab handoff: visible package shell only; monitor does not trade.',
    100000000,
    0.0
)
ON CONFLICT (model_code) DO UPDATE SET
    model_name = EXCLUDED.model_name,
    model_version = EXCLUDED.model_version,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    package_path = EXCLUDED.package_path,
    package_status = EXCLUDED.package_status,
    public_visible = EXCLUDED.public_visible,
    runtime_ready = EXCLUDED.runtime_ready,
    admin_note = EXCLUDED.admin_note,
    seed_money = EXCLUDED.seed_money,
    expected_monthly_return_pct = EXCLUDED.expected_monthly_return_pct,
    updated_at = NOW();
